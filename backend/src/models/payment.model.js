import mongoose from 'mongoose';

/**
 * Modelo de Pago (colección `pagos`).
 * Cada documento representa un intento de checkout Web Checkout de PayU.
 * El monto y la moneda son un snapshot tomado del curso en el servidor.
 */
export const ESTADOS_PAGO = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR'];

const pagoSchema = new mongoose.Schema(
  {
    // Referencia única enviada a PayU como referenceCode.
    referencia: { type: String, required: true },

    // Snapshot mínimo: el webhook llega sin sesión ni JWT.
    usuario: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      nombre: { type: String, required: true },
      correo: { type: String, required: true },
    },

    curso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso', required: true },

    // Unidad mínima de la moneda (100 = un peso para COP).
    montoCentavos: { type: Number, required: true, min: 1 },
    moneda: { type: String, enum: ['COP'], default: 'COP' },

    estado: { type: String, enum: ESTADOS_PAGO, default: 'PENDIENTE' },
    // true cuando una confirmación reservó aplicar la inscripción.
    inscripcionAplicada: { type: Boolean, default: false },

    payu: {
      transaccionId: { type: String, default: null },
      metodoPago: { type: String, default: null },
      estadoOriginal: { type: String, default: null },
      merchantId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

pagoSchema.index({ referencia: 1 }, { unique: true });
pagoSchema.index(
  { 'usuario.id': 1, curso: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: 'APROBADO' },
  }
);

export default mongoose.model('Pago', pagoSchema, 'pagos');
