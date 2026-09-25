import test from 'node:test';
import assert from 'node:assert/strict';

// course.service crea el cliente Groq al importarse; la variable debe existir antes.
process.env.GROQ_API_KEY = 'clave-prueba-groq';
const { default: pagoService } = await import('../../src/services/payment.service.js');

const dependenciasOriginales = {
  pagos: pagoService.pagos,
  usuarios: pagoService.usuarios,
  cursos: pagoService.cursos,
  payu: pagoService.payu,
};

test.beforeEach(() => {
  process.env.PAYU_API_KEY = 'clave-prueba';
  process.env.PAYU_MERCHANT_ID = '100001';
  process.env.PAYU_ACCOUNT_ID = '512321';
  process.env.PAYU_ENV = 'test';
  process.env.BACKEND_URL = 'https://api.mentorsync.ai';
});

test.afterEach(() => {
  pagoService.pagos = dependenciasOriginales.pagos;
  pagoService.usuarios = dependenciasOriginales.usuarios;
  pagoService.cursos = dependenciasOriginales.cursos;
  pagoService.payu = dependenciasOriginales.payu;
});

test('crea el checkout con precio y usuario obtenidos del servidor', async () => {
  let pagoCreado;
  pagoService.cursos = {
    obtenerCursoPorId: async () => ({
      _id: '507f1f77bcf86cd799439011',
      estado: 'publicado',
      precio: 50000,
      inscritos: [],
    }),
  };
  pagoService.usuarios = {
    buscarPorEmail: async () => ({
      _id: '507f1f77bcf86cd799439022',
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
    }),
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

  assert.match(resultado.referencia, /^MS-[0-9a-f-]{36}$/);
  assert.equal(resultado.campos.amount, '50000');
  assert.equal(resultado.campos.buyerEmail, 'ana@example.com');
  assert.equal(pagoCreado.montoCentavos, 5000000);
  assert.equal(pagoCreado.moneda, 'COP');
  assert.equal(pagoCreado.usuario.correo, 'ana@example.com');
});

test('aplica una sola inscripción cuando PayU notifica dos veces', async () => {
  let inscripciones = 0;
  let reclamos = 0;
  const pago = {
    _id: 'pago-1',
    referencia: 'MS-test',
    estado: 'PENDIENTE',
    montoCentavos: 5000000,
    moneda: 'COP',
    inscripcionAplicada: false,
    usuario: { id: 'usuario-1', nombre: 'Ana', correo: 'ana@example.com' },
    curso: 'curso-1',
  };

  pagoService.pagos = {
    actualizarEstado: async (_id, datos) => ({ ...pago, ...datos, payu: datos.payu }),
    reclamarInscripcion: async () => {
      if (reclamos > 0) return null;
      reclamos += 1;
      return { ...pago, inscripcionAplicada: true };
    },
    liberarInscripcion: async () => null,
  };
  pagoService.cursos = {
    inscribirAprendiz: async () => {
      inscripciones += 1;
      return { _id: 'curso-1' };
    },
  };

  const body = {
    merchant_id: '100001',
    reference_sale: 'MS-test',
    value: '50000.00',
    currency: 'COP',
    state_pol: '4',
    transaction_id: 'tx-1',
    payment_method_name: 'VISA',
  };

  await Promise.all([
    pagoService.aplicarConfirmacion(pago, body),
    pagoService.aplicarConfirmacion(pago, body),
  ]);

  assert.equal(inscripciones, 1);
});

test('rechaza un webhook cuyo monto no coincide con el pago creado', async () => {
  pagoService.pagos = {
    actualizarEstado: async () => {
      throw new Error('No debe actualizar');
    },
  };

  await assert.rejects(
    () => pagoService.aplicarConfirmacion(
      {
        _id: 'pago-2',
        estado: 'PENDIENTE',
        montoCentavos: 5000000,
        moneda: 'COP',
      },
      { value: '1.00', currency: 'COP', state_pol: '4' }
    ),
    (error) => error.code === 'AMOUNT_MISMATCH' && error.statusCode === 409
  );
});
