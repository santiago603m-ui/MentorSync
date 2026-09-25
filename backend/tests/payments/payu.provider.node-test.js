import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  armarFormularioCheckout,
  formatearMontoCheckout,
  formatearMontoConfirmacion,
  verificarFirmaConfirmacion,
} from '../../src/services/payments/payu.provider.js';

test.beforeEach(() => {
  process.env.PAYU_API_KEY = '4Vj8eK4rloUd272L48hsrarnUA';
  process.env.PAYU_MERCHANT_ID = '508029';
  process.env.PAYU_ACCOUNT_ID = '512321';
  process.env.PAYU_ENV = 'test';
  process.env.BACKEND_URL = 'https://api.mentorsync.ai';
});

test('arma el formulario Web Checkout con la firma oficial y entorno sandbox', () => {
  const resultado = armarFormularioCheckout({
    referencia: 'TestPayU',
    montoPesos: 20000,
    correo: 'aprendiz@example.com',
    redirectUrl: 'https://app.mentorsync.ai/pago/resultado?ref=TestPayU',
  });

  assert.equal(resultado.accion, 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/');
  assert.equal(resultado.campos.algorithmSignature, 'MD5');
  assert.equal(resultado.campos.test, '1');
  assert.equal(resultado.campos.amount, '20000');
  assert.equal(resultado.campos.signature, '7ee7cf808ce6a39b17481c54f2c57acc');
  assert.equal(resultado.campos.confirmationUrl, 'https://api.mentorsync.ai/api/pagos/confirmacion');
});

test('formatea montos según las reglas de firma de PayU', () => {
  assert.equal(formatearMontoCheckout(20000), '20000');
  assert.equal(formatearMontoCheckout(150.5), '150.50');
  assert.equal(formatearMontoConfirmacion('150.00'), '150.0');
  assert.equal(formatearMontoConfirmacion('150.25'), '150.25');
});

test('valida la firma del webhook con uno y dos decimales', () => {
  const firma = (valor) => crypto
    .createHash('md5')
    .update(`4Vj8eK4rloUd272L48hsrarnUA~508029~PayUTest01~${valor}~USD~4`)
    .digest('hex');

  assert.equal(
    verificarFirmaConfirmacion({
      merchant_id: '508029',
      reference_sale: 'PayUTest01',
      value: '150.00',
      currency: 'USD',
      state_pol: '4',
      sign: firma('150.0'),
    }),
    true
  );

  assert.equal(
    verificarFirmaConfirmacion({
      merchant_id: '508029',
      reference_sale: 'PayUTest01',
      value: '150.25',
      currency: 'USD',
      state_pol: '4',
      sign: firma('150.25'),
    }),
    true
  );
});

test('rechaza merchant o firma manipulados', () => {
  assert.equal(
    verificarFirmaConfirmacion({
      merchant_id: '999999',
      reference_sale: 'PayUTest01',
      value: '150.00',
      currency: 'USD',
      state_pol: '4',
      sign: 'cualquiera',
    }),
    false
  );
});
