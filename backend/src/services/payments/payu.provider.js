import crypto from 'node:crypto';
import { AppError } from '../../utils/AppError.js';

/**
 * Proveedor de pagos: PayU Latam (Colombia, Web Checkout HTML).
 * Todo lo específico de PayU vive únicamente en este archivo.
 *
 * Docs oficiales:
 * - Payment Form: https://developers.payulatam.com/latam/en/docs/integrations/webcheckout-integration/payment-form.html
 * - Confirmation URL: https://developers.payulatam.com/latam/en/docs/integrations/confirmation-url.html
 */

export const MONEDA = 'COP';
export const ALGORITMO_FIRMA = 'MD5';
const ACCION_SANDBOX = 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';
const ACCION_PRODUCCION = 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

function requerirVariable(nombre) {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new AppError(`Falta la variable de entorno ${nombre}`, 500, 'PAYU_NOT_CONFIGURED');
  }
  return valor;
}

function numeroPositivo(valor, nombre) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new AppError(`${nombre} no es válido`, 500, 'PAYU_NOT_CONFIGURED');
  }
  return numero;
}

// La firma del formulario usa exactamente el mismo texto enviado en `amount`.
export function formatearMontoCheckout(valor) {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
}

// PayU redondea la confirmación a un decimal si el segundo decimal es cero.
export function formatearMontoConfirmacion(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return String(valor);
  const segundoDecimal = Math.round((numero % 1) * 100);
  return segundoDecimal % 10 === 0 ? numero.toFixed(1) : numero.toFixed(2);
}

function md5(texto) {
  return crypto.createHash('md5').update(texto, 'utf8').digest('hex');
}

function compararTextoSeguro(a, b) {
  const bufferA = Buffer.from(String(a).toLowerCase(), 'utf8');
  const bufferB = Buffer.from(String(b).toLowerCase(), 'utf8');
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Arma el formulario Web Checkout firmado que el frontend envía por POST.
 * PayU Web Checkout no se integra mediante una URL GET simple.
 */
export function armarFormularioCheckout({ referencia, montoPesos, correo, redirectUrl }) {
  const apiKey = requerirVariable('PAYU_API_KEY');
  const merchantId = requerirVariable('PAYU_MERCHANT_ID');
  const accountId = requerirVariable('PAYU_ACCOUNT_ID');
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
  const confirmationUrl = process.env.PAYU_CONFIRMATION_URL?.trim() || `${backendUrl}/api/pagos/confirmacion`;
  const entorno = process.env.PAYU_ENV === 'production' ? 'production' : 'test';
  const monto = numeroPositivo(montoPesos, 'El monto del curso');
  const montoFormateado = formatearMontoCheckout(monto);
  const firma = md5(`${apiKey}~${merchantId}~${referencia}~${montoFormateado}~${MONEDA}`);
  const tax = process.env.PAYU_TAX ?? '0';
  const taxReturnBase = process.env.PAYU_TAX_RETURN_BASE ?? '0';

  return {
    accion: entorno === 'production' ? ACCION_PRODUCCION : ACCION_SANDBOX,
    campos: {
      algorithmSignature: ALGORITMO_FIRMA,
      merchantId,
      accountId,
      description: 'Inscripción a curso - MentorSync AI',
      referenceCode: referencia,
      amount: montoFormateado,
      tax,
      taxReturnBase,
      currency: MONEDA,
      signature: firma,
      test: entorno === 'production' ? '0' : '1',
      buyerEmail: correo,
      responseUrl: redirectUrl,
      confirmationUrl,
    },
  };
}

/**
 * Verifica la firma MD5 de la confirmación server-to-server de PayU.
 * Siempre se usan los valores que llegaron en la petición, no los de MongoDB.
 */
export function verificarFirmaConfirmacion(body) {
  const apiKey = requerirVariable('PAYU_API_KEY');
  const merchantIdConfigurado = requerirVariable('PAYU_MERCHANT_ID');
  const { merchant_id: merchantId, reference_sale: referencia, value, currency, state_pol: estado, sign } = body ?? {};

  if (!merchantId || !referencia || value === undefined || !currency || estado === undefined || !sign) {
    return false;
  }
  if (merchantId !== merchantIdConfigurado) return false;

  const montoFormateado = formatearMontoConfirmacion(value);
  const firmaEsperada = md5(`${apiKey}~${merchantId}~${referencia}~${montoFormateado}~${currency}~${estado}`);
  return compararTextoSeguro(firmaEsperada, sign);
}

// state_pol documentado por PayU.
export const ESTADOS_POL = {
  4: 'APROBADA',
  5: 'EXPIRADA',
  6: 'RECHAZADA',
  7: 'PENDIENTE',
  104: 'ERROR',
};
