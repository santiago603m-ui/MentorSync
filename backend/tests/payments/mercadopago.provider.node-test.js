import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoMercadoPago,
  verificarFirmaWebhookMercadoPago,
} from '../../src/services/payments/mercadopago.provider.js';

test.beforeEach(() => {
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = 'secret';
});

test('valida la firma del webhook de Mercado Pago', () => {
  assert.equal(
    verificarFirmaWebhookMercadoPago(
      {
        'x-signature': 'ts=2026-10-06T00:00:00.000Z,v1=ff813d92d6e3605abdfc17e3533c1b6281b540ac0922bcb2e360e155d205b826',
        'x-request-id': 'req-1',
      },
      { 'data.id': '123' }
    ),
    true
  );

  assert.equal(
    verificarFirmaWebhookMercadoPago(
      { 'x-signature': 'ts=2026-10-06T00:00:00.000Z,v1=incorrecta', 'x-request-id': 'req-1' },
      { 'data.id': '123' }
    ),
    false
  );
});

test('mapea los estados oficiales de Mercado Pago', () => {
  assert.equal(estadoMercadoPago({ status: 'approved' }), 'APROBADO');
  assert.equal(estadoMercadoPago({ status: 'rejected' }), 'RECHAZADO');
  assert.equal(estadoMercadoPago({ status: 'cancelled' }), 'ANULADO');
  assert.equal(estadoMercadoPago({ status: 'in_process' }), 'PENDIENTE');
});