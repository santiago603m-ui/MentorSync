import mongoose from 'mongoose';

export const ESTADOS_PAGO = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR'];

const pagoSchema = new mongoose.Schema(
  {
    referencia: { type: String, required: true, unique: true },
    usuario: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      nombre: { type: String, required: true },
      correo: { type: String, required: true },
    },
    curso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso', required: true },
    montoCentavos: { type: Number, required: true, min: 1 },
    moneda: { type: String, enum: ['COP'], default: 'COP' },
    estado: { type: String, enum: ESTADOS_PAGO, default: 'PENDIENTE' },
    inscripcionAplicada: { type: Boolean, default: false },
    pasarela: {
      proveedor: { type: String, enum: ['mercadopago', 'simulador'], default: 'mercadopago' },
      idCheckout: { type: String, default: null },
      idPago: { type: String, default: null },
      metodo: { type: String, default: null },
      estadoOriginal: { type: String, default: null },
      detalle: { type: String, default: null },
      evento: { type: String, default: null },
    },
  },
  { timestamps: true }
);

pagoSchema.index(
  { 'usuario.id': 1, curso: 1 },
  { unique: true, partialFilterExpression: { estado: 'APROBADO' } }
);

export default mongoose.model('Pago', pagoSchema, 'pagos');