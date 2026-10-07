import crypto from 'node:crypto';
import { AppError } from '../../utils/AppError.js';

const API_BASE = 'https://api.mercadopago.com';
export const MONEDA = 'COP';

function requerirVariable(nombre) {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new AppError(`Falta la variable de entorno ${nombre}`, 500, 'MERCADO_PAGO_NOT_CONFIGURED');
  }
  return valor;
}

function esSandbox() {
  return process.env.MERCADO_PAGO_ENV !== 'production';
}

async function apiMercadoPago(ruta, opciones = {}) {
  const accessToken = requerirVariable('MERCADO_PAGO_ACCESS_TOKEN');
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const mensaje = cuerpo?.message
      ? `${cuerpo.message}${cuerpo.cause ? `: ${cuerpo.cause}` : ''}`
      : 'Mercado Pago rechazó la solicitud';
    throw new AppError(mensaje, 502, 'MERCADO_PAGO_API_ERROR');
  }
  return cuerpo;
}

export async function crearPreferenciaMercadoPago({
  referencia,
  monto,
  correo,
  titulo,
  returnUrl,
}) {
  const valor = Number(monto);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new AppError('El monto del curso no es válido', 500, 'MERCADO_PAGO_INVALID_AMOUNT');
  }

  const urlPublica = /^https:\/\//i.test(returnUrl) && !/^https:\/\/(localhost|127\.0\.0\.1)/i.test(returnUrl);
  const preference = await apiMercadoPago('/checkout/preferences', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      items: [
        {
          id: referencia,
          title: titulo.slice(0, 120),
          description: 'Inscripción a curso - MentorSync AI',
          quantity: 1,
          currency_id: MONEDA,
          unit_price: valor,
        },
      ],
      payer: { email: correo },
      external_reference: referencia,
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl,
      },
      ...(urlPublica ? { auto_return: 'approved' } : {}),
      statement_descriptor: 'MENTORSYNC AI',
      notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL?.trim() || undefined,
      metadata: { provider: 'mentorsync', referencia },
    }),
  });

  const redirectUrl = esSandbox() ? preference.sandbox_init_point : preference.init_point;
  if (!preference.id || !redirectUrl) {
    throw new AppError('Mercado Pago no devolvió una URL de checkout', 502, 'MERCADO_PAGO_INVALID_RESPONSE');
  }

  return {
    redirectUrl,
    preferenceId: preference.id,
    status: 'PREFERENCE_CREATED',
  };
}

export async function obtenerPagoMercadoPago(paymentId) {
  if (!paymentId) return null;
  return apiMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function buscarPagoPorReferencia(referencia) {
  const resultado = await apiMercadoPago(
    `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}`
  );
  return resultado?.results?.[0] || null;
}

function compararSeguro(a, b) {
  const bufferA = Buffer.from(String(a).toLowerCase());
  const bufferB = Buffer.from(String(b).toLowerCase());
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

export function verificarFirmaWebhookMercadoPago(headers = {}, query = {}) {
  const secret = requerirVariable('MERCADO_PAGO_WEBHOOK_SECRET');
  const firma = String(headers['x-signature'] || '');
  const requestId = String(headers['x-request-id'] || '');
  const dataId = String(query['data.id'] || '');
  if (!firma || !requestId || !dataId) return false;

  const partes = Object.fromEntries(
    firma.split(',').map((parte) => {
      const [clave, valor] = parte.split('=');
      return [clave?.trim(), valor?.trim()];
    })
  );
  if (!partes.ts || !partes.v1) return false;

  const manifiesto = `id:${dataId};request-id:${requestId};`;
  const esperada = crypto.createHmac('sha256', secret).update(manifiesto, 'utf8').digest('hex');
  return compararSeguro(esperada, partes.v1);
}

export function estadoMercadoPago(payment) {
  const estado = String(payment?.status || '').toLowerCase();
  if (estado === 'approved') return 'APROBADO';
  if (estado === 'rejected') return 'RECHAZADO';
  if (estado === 'cancelled' || estado === 'charged_back') return 'ANULADO';
  if (estado === 'authorized') return 'PENDIENTE';
  return 'PENDIENTE';
}