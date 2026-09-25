import { randomUUID } from 'node:crypto';
import pagoRepository from '../repositories/payment.repository.js';
import authRepository from '../repositories/auth.repository.js';
import cursoService from './course.service.js';
import * as payu from './payments/payu.provider.js';
import { AppError } from '../utils/AppError.js';

const MAPA_ESTADOS = {
  APROBADA: 'APROBADO',
  RECHAZADA: 'RECHAZADO',
  EXPIRADA: 'ANULADO',
  PENDIENTE: 'PENDIENTE',
  ERROR: 'ERROR',
};

// Un mismo referenceCode puede reintentarse en PayU. Una aprobación siempre gana;
// después de APROBADO, cualquier notificación tardía se ignora.
function transicionValida(actual, nuevo) {
  if (actual === nuevo) return true;
  if (actual === 'PENDIENTE') return true;
  if (['RECHAZADO', 'ANULADO', 'ERROR'].includes(actual)) return nuevo === 'APROBADO';
  return false;
}

class PagoService {
  constructor() {
    this.pagos = pagoRepository;
    this.usuarios = authRepository;
    this.cursos = cursoService;
    this.payu = payu;
  }

  async crearCheckout(usuarioToken, cursoId) {
    const curso = await this.cursos.obtenerCursoPorId(cursoId);

    if (curso.estado !== 'publicado') {
      throw new AppError('El curso no está disponible para inscripción', 400, 'COURSE_NOT_PUBLISHED');
    }
    if (!Number.isFinite(Number(curso.precio)) || Number(curso.precio) <= 0) {
      throw new AppError('Este curso es gratuito: usa la inscripción directa', 400, 'COURSE_IS_FREE');
    }

    const usuarioId = String(usuarioToken.id);
    const yaInscrito = curso.inscritos.some((inscrito) => String(inscrito.id) === usuarioId);
    if (yaInscrito) {
      throw new AppError('Ya estás inscrito en este curso', 409, 'ALREADY_ENROLLED');
    }
    if (await this.pagos.existeAprobado(usuarioId, curso._id)) {
      throw new AppError('Ya pagaste este curso', 409, 'ALREADY_PAID');
    }

    const usuario = await this.usuarios.buscarPorEmail(usuarioToken.email);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    const referencia = `MS-${randomUUID()}`;
    const montoCentavos = Math.round(Number(curso.precio) * 100);
    if (montoCentavos < 1) {
      throw new AppError('El precio del curso no es válido', 400, 'INVALID_COURSE_PRICE');
    }

    // Armar y firmar primero evita dejar intentos huérfanos si PayU no está configurado.
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/$/, '');
    const { accion, campos } = this.payu.armarFormularioCheckout({
      referencia,
      montoPesos: Number(curso.precio),
      correo: usuario.email,
      redirectUrl: `${frontendUrl}/pago/resultado?ref=${encodeURIComponent(referencia)}`,
    });

    await this.pagos.crear({
      referencia,
      usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.email },
      curso: curso._id,
      montoCentavos,
      moneda: payu.MONEDA,
    });

    return { accion, campos, referencia };
  }

  /** Confirmación server-to-server de PayU (application/x-www-form-urlencoded). */
  async procesarConfirmacion(body) {
    if (!this.payu.verificarFirmaConfirmacion(body)) {
      throw new AppError('Firma de confirmación inválida', 401, 'INVALID_SIGNATURE');
    }

    const pago = await this.pagos.buscarPorReferencia(body.reference_sale);
    if (!pago) return { ignorado: true };

    await this.aplicarConfirmacion(pago, body);
    return { ignorado: false };
  }

  /** Procesamiento idempotente y seguro ante reintentos/notificaciones simultáneas. */
  async aplicarConfirmacion(pago, body) {
    const montoRecibido = Math.round(Number(body.value) * 100);
    const monedaRecibida = String(body.currency || '').toUpperCase();

    if (!Number.isFinite(montoRecibido) || montoRecibido !== pago.montoCentavos || monedaRecibida !== pago.moneda) {
      throw new AppError(
        'El monto o la moneda reportados no coinciden con el pago registrado',
        409,
        'AMOUNT_MISMATCH'
      );
    }

    const estadoPayU = payu.ESTADOS_POL[Number(body.state_pol)] ?? 'ERROR';
    const estadoNuevo = MAPA_ESTADOS[estadoPayU] ?? 'ERROR';
    let actual = pago;

    // Si dos webhooks llegan juntos, el compare-and-set del repo decide el ganador.
    // Si una notificación quedó desfasada, se relee y se reintenta una vez.
    for (let intento = 0; intento < 3; intento += 1) {
      if (estadoNuevo === actual.estado || !transicionValida(actual.estado, estadoNuevo)) break;

      const actualizado = await this.pagos.actualizarEstado(actual._id, {
        estado: estadoNuevo,
        estadoEsperado: actual.estado,
        payu: {
          transaccionId: body.transaction_id ?? null,
          metodoPago: body.payment_method_name ?? null,
          estadoOriginal: estadoPayU,
          merchantId: body.merchant_id,
        },
      });

      if (actualizado) {
        actual = actualizado;
        break;
      }
      actual = await this.pagos.buscarPorReferencia(pago.referencia);
    }

    if (actual.estado === 'APROBADO') {
      await this.aplicarInscripcion(actual);
    }
    return actual;
  }

  /**
   * La respuesta del navegador no es confiable: el frontend consulta únicamente
   * el estado guardado por el webhook. Si el pago ya fue aprobado pero la
   * inscripción quedó pendiente por un fallo temporal, se reintenta de forma segura.
   */
  async consultarEstadoLocal(referencia, usuarioId) {
    let pago = await this.pagos.buscarPorReferencia(referencia);
    if (!pago || String(pago.usuario.id) !== String(usuarioId)) {
      throw new AppError('Pago no encontrado', 404, 'PAYMENT_NOT_FOUND');
    }

    if (pago.estado === 'APROBADO' && !pago.inscripcionAplicada) {
      await this.aplicarInscripcion(pago);
      pago = await this.pagos.buscarPorReferencia(referencia);
    }

    return {
      referencia: pago.referencia,
      estado: pago.estado,
      cursoId: String(pago.curso),
      inscripcionAplicada: Boolean(pago.inscripcionAplicada),
    };
  }

  async aplicarInscripcion(pago) {
    const reclamado = await this.pagos.reclamarInscripcion(pago._id);
    if (!reclamado) return;

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
      await this.pagos.liberarInscripcion(pago._id);
      throw error;
    }
  }
}

export default new PagoService();
