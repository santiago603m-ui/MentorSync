import crypto from 'node:crypto';
import { AppError } from '../../utils/AppError.js';

/**
 * Proveedor de pagos: PayU Latam (Colombia, Web Checkout — formulario HTML).
 * Todo lo específico de PayU vive SOLO en este archivo.
 *
 * Docs oficiales:
 *  - Formulario de pago:      https://developers.payulatam.com/latam/es/docs/integrations/webcheckout-integration/payment-form.html
 *  - Página de confirmación:  https://developers.payulatam.com/latam/es/docs/integrations/webcheckout-integration/confirmation-page.html
 *
 * A diferencia de Wompi (redirección a una URL), PayU recibe el pago mediante un
 * FORMULARIO enviado por POST a su gateway. Por eso `armarFormularioCheckout` no
 * devuelve una URL: devuelve la acción del formulario + los campos que hay que enviar.
 */

export const MONEDA = 'COP';
const ACCION_SANDBOX = 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';
const ACCION_PRODUCCION = 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

function requerirVariable(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new AppError(`Falta la variable de entorno ${nombre}`, 500, 'PAYU_NOT_CONFIGURED');
  }
  return valor;
}

// El monto del FORMULARIO de checkout se firma tal cual se envía: sin decimales si es
// un número entero, o con 2 decimales si tiene centavos. Verificado byte a byte contra
// un caso de prueba oficial de PayU (referenceCode=TestPayU, amount=20000 → sin decimales).
export function formatearMontoCheckout(valor) {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
}

// El monto de la CONFIRMACIÓN (campo `value`) sigue una regla distinta y sí documentada
// así por PayU: si el 2º decimal es 0, se firma con SOLO 1 decimal; si no, con 2.
export function formatearMontoConfirmacion(valor) {
  const decimales = Math.round((valor % 1) * 100);
  return decimales % 10 === 0 ? valor.toFixed(1) : valor.toFixed(2);
}

const md5 = (texto) => crypto.createHash('md5').update(texto, 'utf8').digest('hex');

function iguales(a, b) {
  const bufA = Buffer.from(String(a).toLowerCase());
  const bufB = Buffer.from(String(b).toLowerCase());
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Arma los campos del formulario de Web Checkout, ya firmados.
 * El frontend recibe { accion, campos } y hace un POST normal (auto-submit) con eso.
 */
export function armarFormularioCheckout({ referencia, montoPesos, correo, redirectUrl }) {
  const apiKey = requerirVariable('PAYU_API_KEY');
  const merchantId = requerirVariable('PAYU_MERCHANT_ID');
  const accountId = requerirVariable('PAYU_ACCOUNT_ID');
  const entorno = process.env.PAYU_ENV || 'test'; // 'test' = sandbox por defecto (fail-safe)

  const montoFormateado = formatearMontoCheckout(montoPesos);
  const firma = md5(`${apiKey}~${merchantId}~${referencia}~${montoFormateado}~${MONEDA}`);

  return {
    accion: entorno === 'production' ? ACCION_PRODUCCION : ACCION_SANDBOX,
    campos: {
      merchantId,
      accountId,
      description: 'Inscripción a curso - MentorSync',
      referenceCode: referencia,
      amount: montoFormateado,
      tax: '0',
      taxReturnBase: '0',
      currency: MONEDA,
      signature: firma,
      test: entorno === 'production' ? 'FALSE' : 'TRUE',
      buyerEmail: correo,
      responseUrl: redirectUrl,
      confirmationUrl: requerirVariable('PAYU_CONFIRMATION_URL'),
    },
  };
}

/**
 * Verifica la firma que llega en la confirmación (webhook) de PayU.
 * Campos que envía PayU (application/x-www-form-urlencoded):
 *   merchant_id, reference_sale, value, currency, state_pol, sign, transaction_id, ...
 * SIEMPRE se firma con los valores QUE LLEGARON en la petición, nunca con los de la BD.
 */
export function verificarFirmaConfirmacion(body) {
  const apiKey = requerirVariable('PAYU_API_KEY');
  const { merchant_id, reference_sale, value, currency, state_pol, sign } = body ?? {};
  if (!merchant_id || !reference_sale || value === undefined || !currency || !state_pol || !sign) {
    return false;
  }

  const montoFormateado = formatearMontoConfirmacion(Number(value));
  const esperada = md5(`${apiKey}~${merchant_id}~${reference_sale}~${montoFormateado}~${currency}~${state_pol}`);
  return iguales(esperada, sign);
}

// Códigos de estado (state_pol) documentados por PayU
export const ESTADOS_POL = {
  4: 'APROBADA',
  6: 'RECHAZADA',
  5: 'EXPIRADA',
  7: 'PENDIENTE',
  104: 'ERROR',
};