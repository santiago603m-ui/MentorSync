import { randomUUID } from 'node:crypto';
import pagoRepository from '../repositories/payment.repository.js';
import authRepository from '../repositories/auth.repository.js';
import cursoService from './course.service.js';
import * as payu from './payments/payu.provider.js';
import { AppError } from '../utils/AppError.js';

// state_pol de PayU → estados internos del modelo Pago
const MAPA_ESTADOS = {
  APROBADA: 'APROBADO',
  RECHAZADA: 'RECHAZADO',
  EXPIRADA: 'ANULADO',
  PENDIENTE: 'PENDIENTE',
  ERROR: 'ERROR',
};

// PENDIENTE puede pasar a cualquier estado final; APROBADO solo puede terminar ANULADO;
// los demás son finales. Así una notificación tardía o repetida nunca "retrocede" un pago.
function transicionValida(actual, nuevo) {
  if (actual === nuevo) return true;
  if (actual === 'PENDIENTE') return true;
  if (actual === 'APROBADO') return nuevo === 'ANULADO';
  return false;
}

class PagoService {
  constructor() {
    this.pagos = pagoRepository;
    this.usuarios = authRepository;
    this.cursos = cursoService;
    this.payu = payu;
  }

  /**
   * Paso 1: el aprendiz quiere pagar un curso.
   * El PRECIO sale de la base de datos, nunca del cliente.
   * Devuelve la acción y los campos del formulario que el frontend debe enviar por POST.
   */
  async crearCheckout(usuarioToken, cursoId) {
    const curso = await this.cursos.obtenerCursoPorId(cursoId); // lanza 404 si no existe

    if (curso.estado !== 'publicado') {
      throw new AppError('El curso no está disponible para inscripción', 400, 'COURSE_NOT_PUBLISHED');
    }
    if (!(curso.precio > 0)) {
      throw new AppError('Este curso es gratuito: usa la inscripción directa', 400, 'COURSE_IS_FREE');
    }

    const yaInscrito = curso.inscritos.some((i) => i.id.toString() === String(usuarioToken.id));
    if (yaInscrito) {
      throw new AppError('Ya estás inscrito en este curso', 409, 'ALREADY_ENROLLED');
    }
    if (await this.pagos.existeAprobado(usuarioToken.id, curso._id)) {
      throw new AppError('Ya pagaste este curso', 409, 'ALREADY_PAID');
    }

    const usuario = await this.usuarios.buscarPorEmail(usuarioToken.email);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const referencia = `MS-${randomUUID()}`; // única por intento

    await this.pagos.crear({
      referencia,
      usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.email },
      curso: curso._id,
      montoCentavos: Math.round(curso.precio * 100), // se guarda en centavos, igual que con Wompi
      moneda: payu.MONEDA,
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
    const { accion, campos } = this.payu.armarFormularioCheckout({
      referencia,
      montoPesos: curso.precio, // PayU trabaja en pesos, no en centavos
      correo: usuario.email,
      redirectUrl: `${frontend}/pago/resultado?ref=${referencia}`,
    });

    return { accion, campos, referencia };
  }

  /**
   * Confirmación (webhook) de PayU: llega como application/x-www-form-urlencoded.
   * Solo se procesa si la firma es válida.
   */
  async procesarConfirmacion(body) {
    if (!this.payu.verificarFirmaConfirmacion(body)) {
      throw new AppError('Firma de confirmación inválida', 401, 'INVALID_SIGNATURE');
    }

    const pago = await this.pagos.buscarPorReferencia(body.reference_sale);
    if (!pago) return { ignorado: true }; // referencia que no es de este sistema

    await this.aplicarConfirmacion(pago, body);
    return { ignorado: false };
  }

  /**
   * Núcleo idempotente: se puede llamar N veces con la misma confirmación sin duplicar nada.
   */
  async aplicarConfirmacion(pago, body) {
    const montoRecibido = Math.round(Number(body.value) * 100);
    // Defensa anti-manipulación: lo que PayU reporta debe coincidir con lo registrado.
    if (montoRecibido !== pago.montoCentavos || body.currency !== pago.moneda) {
      throw new AppError(
        'El monto o la moneda reportados no coinciden con el pago registrado',
        409,
        'AMOUNT_MISMATCH'
      );
    }

    const estadoPol = payu.ESTADOS_POL[Number(body.state_pol)] ?? 'ERROR';
    const estadoNuevo = MAPA_ESTADOS[estadoPol] ?? 'ERROR';

    let actual = pago;
    if (estadoNuevo !== pago.estado && transicionValida(pago.estado, estadoNuevo)) {
      actual = await this.pagos.actualizarEstado(pago._id, {
        estado: estadoNuevo,
        wompi: { // mismo sub-documento del modelo; se reutiliza para cualquier pasarela
          transaccionId: body.transaction_id ?? null,
          metodoPago: body.payment_method_name ?? null,
          estadoOriginal: estadoPol,
        },
      });
    }

    if (actual.estado === 'APROBADO') {
      await this.aplicarInscripcion(actual);
    }
    return actual;
  }

  /**
   * La página de respuesta de PayU NO es confiable (el propio PayU lo advierte: el
   * usuario puede alterar los parámetros o cerrar el navegador). Por eso el frontend,
   * al volver, no le pregunta a PayU: consulta el estado que YA tenemos en nuestra BD,
   * actualizado por la confirmación (webhook), que es la única fuente de verdad.
   */
  async consultarEstadoLocal(referencia, usuarioId) {
    const pago = await this.pagos.buscarPorReferencia(referencia);
    if (!pago || String(pago.usuario.id) !== String(usuarioId)) {
      throw new AppError('Pago no encontrado', 404, 'PAYMENT_NOT_FOUND');
    }
    return { referencia: pago.referencia, estado: pago.estado, cursoId: String(pago.curso) };
  }

  async aplicarInscripcion(pago) {
    const reclamado = await this.pagos.reclamarInscripcion(pago._id);
    if (!reclamado) return; // ya inscrito (o en proceso por otra petición)

    try {
      const curso = await this.cursos.inscribirAprendiz(String(pago.curso), {
        id: pago.usuario.id,
        nombre: pago.usuario.nombre,
        correo: pago.usuario.correo,
      });
      if (!curso) {
        throw new AppError('El curso ya no existe: no se pudo inscribir', 404, 'COURSE_NOT_FOUND');
      }
    } catch (error) {
      // Libera el "candado" para que el reintento de la confirmación lo repita.
      await this.pagos.liberarInscripcion(pago._id);
      throw error;
    }
  }
}

export default new PagoService();