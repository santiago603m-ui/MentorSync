import mongoose from 'mongoose';

/**
 * Modelo de Pago (colección `pagos`).
 * Un registro = un INTENTO de pago. Se crea en estado PENDIENTE cuando el aprendiz
 * pulsa "Inscribirse" en un curso de pago, y se actualiza cuando Wompi confirma.
 *
 * El monto y la moneda se guardan AQUÍ (tomados de la BD al crear el checkout, nunca del
 * cliente) para poder compararlos contra lo que Wompi reporte después.
 */
export const ESTADOS_PAGO = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR'];

const pagoSchema = new mongoose.Schema(
  {
    // Referencia única que enviamos a Wompi (una nueva por cada intento de pago)
    referencia: { type: String, required: true, unique: true },

    // Copia (snapshot) de los datos del aprendiz: el webhook llega sin sesión/JWT
    usuario: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      nombre: { type: String, required: true },
      correo: { type: String, required: true },
    },

    curso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso', required: true },

    montoCentavos: { type: Number, required: true, min: 1 },
    moneda: { type: String, enum: ['COP'], default: 'COP' },

    estado: { type: String, enum: ESTADOS_PAGO, default: 'PENDIENTE' },

    // true cuando el aprendiz ya quedó agregado a curso.inscritos por este pago
    inscripcionAplicada: { type: Boolean, default: false },

    wompi: {
      transaccionId: { type: String, default: null },
      metodoPago: { type: String, default: null }, // CARD, NEQUI, PSE, ...
      estadoOriginal: { type: String, default: null }, // APPROVED, DECLINED, ...
    },
  },
  { timestamps: true }
);

pagoSchema.index({ 'usuario.id': 1, curso: 1 });

export default mongoose.model('Pago', pagoSchema, 'pagos');