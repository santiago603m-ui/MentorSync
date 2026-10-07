import { randomUUID } from 'node:crypto';
import pagoRepository from '../repositories/payment.repository.js';
import authRepository from '../repositories/auth.repository.js';
import cursoService from './course.service.js';
import * as mercadoPago from './payments/mercadopago.provider.js';
import { AppError } from '../utils/AppError.js';

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
    this.mercadoPago = mercadoPago;
  }

  proveedorActivo() {
    return process.env.PAYMENT_PROVIDER === 'simulador' ? 'simulador' : 'mercadopago';
  }

  esSimulador() {
    return this.proveedorActivo() === 'simulador';
  }

  async crearCheckout(usuarioToken, cursoId) {
    const curso = await this.cursos.obtenerCursoPorId(cursoId);
    if (curso.estado !== 'publicado') {
      throw new AppError('El curso no está disponible para inscripción', 400, 'COURSE_NOT_PUBLISHED');
    }
    if (!(curso.precio > 0)) {
      throw new AppError('Este curso es gratuito: usa la inscripción directa', 400, 'COURSE_IS_FREE');
    }

    const usuarioId = String(usuarioToken.id);
    const yaInscrito = curso.inscritos.some((item) => String(item.id) === usuarioId);
    if (yaInscrito) {
      throw new AppError('Ya estás inscrito en este curso', 409, 'ALREADY_ENROLLED');
    }
    if (await this.pagos.existeAprobado(usuarioId, curso._id)) {
      throw new AppError('Ya pagaste este curso', 409, 'ALREADY_PAID');
    }

    const usuario = await this.usuarios.buscarPorEmail(usuarioToken.email);
    if (!usuario) throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');

    const referencia = `MS-${randomUUID()}`;
    const datosPago = {
      referencia,
      usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.email },
      curso: curso._id,
      montoCentavos: Math.round(Number(curso.precio) * 100),
      moneda: mercadoPago.MONEDA,
      estado: 'PENDIENTE',
      inscripcionAplicada: false,
    };

    if (this.esSimulador()) {
      const frontendUrl = (process.env.SIMULATOR_FRONTEND_URL || 'http://localhost:4200').replace(/\/$/, '');
      const simuladorUrl = `${frontendUrl}/pago/simulador?ref=${encodeURIComponent(referencia)}`;
      await this.pagos.crear({
        ...datosPago,
        pasarela: { proveedor: 'simulador', idCheckout: `sim_${referencia}`, estadoOriginal: 'PENDIENTE' },
      });
      return { modoSimulacion: true, simuladorUrl, referencia };
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/$/, '');
    const returnUrl = `${frontendUrl}/pago/resultado?ref=${encodeURIComponent(referencia)}`;
    const checkout = await this.mercadoPago.crearPreferenciaMercadoPago({
      referencia,
      monto: Number(curso.precio),
      correo: usuario.email,
      titulo: curso.titulo,
      returnUrl,
    });

    await this.pagos.crear({
      ...datosPago,
      pasarela: {
        proveedor: 'mercadopago',
        idCheckout: checkout.preferenceId,
        estadoOriginal: checkout.status,
      },
    });

    return { ...checkout, referencia };
  }

  async simularPago(referencia, usuarioId, resultado) {
    if (!this.esSimulador()) {
      throw new AppError('El simulador de pagos está deshabilitado', 403, 'PAYMENT_SIMULATOR_DISABLED');
    }
    if (!['aprobado', 'rechazado'].includes(resultado)) {
      throw new AppError('Resultado de simulación inválido', 400, 'INVALID_SIMULATION_RESULT');
    }

    const pago = await this.pagos.buscarPorReferencia(referencia);
    if (!pago || String(pago.usuario.id) !== String(usuarioId)) {
      throw new AppError('Pago no encontrado', 404, 'PAYMENT_NOT_FOUND');
    }
    if (pago.estado !== 'PENDIENTE') {
      return { referencia: pago.referencia, estado: pago.estado, inscripcionAplicada: pago.inscripcionAplicada };
    }

    const estadoNuevo = resultado === 'aprobado' ? 'APROBADO' : 'RECHAZADO';
    let actualizado = await this.pagos.actualizarEstado(pago._id, {
      estado: estadoNuevo,
      estadoEsperado: 'PENDIENTE',
      pasarela: {
        proveedor: 'simulador',
        idPago: `sim_${randomUUID()}`,
        metodo: 'SIMULADOR',
        estadoOriginal: estadoNuevo,
        detalle: resultado,
        evento: resultado === 'aprobado' ? 'approved' : 'rejected',
      },
    });
    if (!actualizado) actualizado = await this.pagos.buscarPorReferencia(referencia);

    if (actualizado.estado === 'APROBADO') {
      await this.aplicarInscripcion(actualizado);
      actualizado = await this.pagos.buscarPorReferencia(referencia);
    }
    return {
      referencia: actualizado.referencia,
      estado: actualizado.estado,
      inscripcionAplicada: Boolean(actualizado.inscripcionAplicada),
    };
  }

  async procesarConfirmacion(body, headers, query) {
    if (!this.mercadoPago.verificarFirmaWebhookMercadoPago(headers, query)) {
      throw new AppError('Firma de confirmación inválida', 401, 'INVALID_SIGNATURE');
    }

    const paymentId = query['data.id'] || body?.data?.id;
    const payment = await this.mercadoPago.obtenerPagoMercadoPago(paymentId);
    if (!payment) return { ignorado: true };

    const referencia = payment.external_reference;
    if (!referencia) return { ignorado: true };

    const pago = await this.pagos.buscarPorReferencia(referencia);
    if (!pago) return { ignorado: true };

    await this.aplicarPagoMercadoPago(pago, payment);
    return { ignorado: false };
  }

  async aplicarPagoMercadoPago(pago, payment) {
    const monto = Math.round(Number(payment.transaction_amount) * 100);
    const moneda = String(payment.currency_id || '').toUpperCase();
    if (monto !== pago.montoCentavos || moneda !== pago.moneda) {
      throw new AppError('El monto o la moneda no coinciden con el pago', 409, 'AMOUNT_MISMATCH');
    }

    const estadoNuevo = this.mercadoPago.estadoMercadoPago(payment);
    let actual = pago;

    for (let intento = 0; intento < 3; intento += 1) {
      if (estadoNuevo === actual.estado || !transicionValida(actual.estado, estadoNuevo)) break;
      const actualizado = await this.pagos.actualizarEstado(actual._id, {
        estado: estadoNuevo,
        estadoEsperado: actual.estado,
        pasarela: {
          proveedor: 'mercadopago',
          idPago: payment.id ?? null,
          metodo: payment.payment_method_id ?? null,
          estadoOriginal: payment.status ?? null,
          detalle: payment.status_detail ?? null,
          evento: payment.status ?? null,
        },
      });
      if (actualizado) {
        actual = actualizado;
        break;
      }
      actual = await this.pagos.buscarPorReferencia(pago.referencia);
    }

    if (actual.estado === 'APROBADO') await this.aplicarInscripcion(actual);
    return actual;
  }

  async consultarEstadoLocal(referencia, usuarioId) {
    let pago = await this.pagos.buscarPorReferencia(referencia);
    if (!pago || String(pago.usuario.id) !== String(usuarioId)) {
      throw new AppError('Pago no encontrado', 404, 'PAYMENT_NOT_FOUND');
    }

    if (
      pago.estado === 'PENDIENTE' &&
      pago.pasarela?.proveedor === 'mercadopago' &&
      !this.esSimulador()
    ) {
      const payment = await this.mercadoPago.buscarPagoPorReferencia(referencia);
      if (payment) await this.aplicarPagoMercadoPago(pago, payment);
      pago = await this.pagos.buscarPorReferencia(referencia);
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
      if (!curso) throw new AppError('El curso ya no existe', 404, 'COURSE_NOT_FOUND');
    } catch (error) {
      await this.pagos.liberarInscripcion(pago._id);
      throw error;
    }
  }
}

export default new PagoService();