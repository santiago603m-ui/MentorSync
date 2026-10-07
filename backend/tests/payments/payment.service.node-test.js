import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GROQ_API_KEY = 'clave-prueba-groq';
const { default: pagoService } = await import('../../src/services/payment.service.js');

const originales = {
  pagos: pagoService.pagos,
  usuarios: pagoService.usuarios,
  cursos: pagoService.cursos,
  mercadoPago: pagoService.mercadoPago,
};

test.beforeEach(() => {
  process.env.FRONTEND_URL = 'https://app.mentorsync.ai';
  process.env.MERCADO_PAGO_ENV = 'sandbox';
  delete process.env.PAYMENT_PROVIDER;
  delete process.env.SIMULATOR_FRONTEND_URL;
});

test.afterEach(() => {
  pagoService.pagos = originales.pagos;
  pagoService.usuarios = originales.usuarios;
  pagoService.cursos = originales.cursos;
  pagoService.mercadoPago = originales.mercadoPago;
  delete process.env.PAYMENT_PROVIDER;
});

function cursoPrueba() {
  return {
    obtenerCursoPorId: async () => ({
      _id: '507f1f77bcf86cd799439011',
      titulo: 'Curso de prueba',
      estado: 'publicado',
      precio: 50000,
      inscritos: [],
    }),
    inscribirAprendiz: async () => ({ _id: '507f1f77bcf86cd799439011' }),
  };
}

test('crea una preferencia de Mercado Pago usando precio y usuario del servidor', async () => {
  let pagoCreado;
  pagoService.cursos = cursoPrueba();
  pagoService.usuarios = {
    buscarPorEmail: async () => ({
      _id: '507f1f77bcf86cd799439022',
      nombre: 'Ana',
      email: 'ana@example.com',
    }),
  };
  pagoService.mercadoPago = {
    MONEDA: 'COP',
    crearPreferenciaMercadoPago: async (datos) => {
      assert.equal(datos.referencia.startsWith('MS-'), true);
      assert.equal(datos.monto, 50000);
      assert.equal(datos.titulo, 'Curso de prueba');
      return {
        redirectUrl: 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=test',
        preferenceId: 'pref-test',
        status: 'PREFERENCE_CREATED',
      };
    },
  };
  pagoService.pagos = {
    existeAprobado: async () => false,
    crear: async (datos) => {
      pagoCreado = datos;
      return datos;
    },
  };

  const resultado = await pagoService.crearCheckout(
    { id: '507f1f77bcf86cd799439022', email: 'ana@example.com' },
    '507f1f77bcf86cd799439011'
  );

  assert.equal(resultado.preferenceId, 'pref-test');
  assert.equal(pagoCreado.pasarela.proveedor, 'mercadopago');
  assert.equal(pagoCreado.montoCentavos, 5000000);
});

test('dos notificaciones de Mercado Pago aplican una sola inscripción', async () => {
  let inscripciones = 0;
  let reclamos = 0;
  const pago = {
    _id: 'pago-1',
    referencia: 'MS-test',
    estado: 'PENDIENTE',
    montoCentavos: 5000000,
    moneda: 'COP',
    pasarela: { proveedor: 'mercadopago' },
    usuario: { id: 'usuario-1', nombre: 'Ana', correo: 'ana@example.com' },
    curso: 'curso-1',
  };

  pagoService.cursos = {
    ...cursoPrueba(),
    inscribirAprendiz: async () => {
      inscripciones += 1;
      return { _id: 'curso-1' };
    },
  };
  pagoService.pagos = {
    actualizarEstado: async (_id, datos) => ({ ...pago, ...datos, pasarela: datos.pasarela }),
    reclamarInscripcion: async () => {
      if (reclamos > 0) return null;
      reclamos += 1;
      return { ...pago, inscripcionAplicada: true };
    },
    liberarInscripcion: async () => null,
  };

  const payment = {
    id: 123456,
    external_reference: 'MS-test',
    transaction_amount: 50000,
    currency_id: 'COP',
    status: 'approved',
    status_detail: 'accredited',
    payment_method_id: 'visa',
  };

  await Promise.all([
    pagoService.aplicarPagoMercadoPago(pago, payment),
    pagoService.aplicarPagoMercadoPago(pago, payment),
  ]);

  assert.equal(inscripciones, 1);
});

test('el simulador local aprueba un pago sin llamar a Mercado Pago', async () => {
  process.env.PAYMENT_PROVIDER = 'simulador';
  process.env.SIMULATOR_FRONTEND_URL = 'http://localhost:4200';
  let pagoCreado;
  let inscripciones = 0;

  pagoService.cursos = {
    ...cursoPrueba(),
    inscribirAprendiz: async () => {
      inscripciones += 1;
      return { _id: '507f1f77bcf86cd799439011' };
    },
  };
  pagoService.usuarios = {
    buscarPorEmail: async () => ({
      _id: '507f1f77bcf86cd799439022',
      nombre: 'Ana',
      email: 'ana@example.com',
    }),
  };
  pagoService.pagos = {
    existeAprobado: async () => false,
    crear: async (datos) => {
      pagoCreado = datos;
      return datos;
    },
    buscarPorReferencia: async () => pagoCreado,
    actualizarEstado: async (_id, datos) => {
      pagoCreado = { ...pagoCreado, ...datos, pasarela: datos.pasarela };
      return pagoCreado;
    },
    reclamarInscripcion: async () => ({ ...pagoCreado, inscripcionAplicada: true }),
    liberarInscripcion: async () => null,
  };

  const checkout = await pagoService.crearCheckout(
    { id: '507f1f77bcf86cd799439022', email: 'ana@example.com' },
    '507f1f77bcf86cd799439011'
  );
  assert.equal(checkout.modoSimulacion, true);

  const resultado = await pagoService.simularPago(
    checkout.referencia,
    '507f1f77bcf86cd799439022',
    'aprobado'
  );

  assert.equal(resultado.estado, 'APROBADO');
  assert.equal(inscripciones, 1);
});