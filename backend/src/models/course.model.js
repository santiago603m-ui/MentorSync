import mongoose from 'mongoose';

const cursoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: 120,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: 2000,
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    portadaUrl: {
      type: String,
      default: null,
    },
    estado: {
      type: String,
      enum: ['borrador', 'publicado', 'archivado'],
      default: 'publicado',
    },
    precio: {
      type: Number,
      default: 0,
      min: 0,
    },
    duracionEstimadaHoras: {
      type: Number,
      default: 0,
      min: 0,
    },
    bot: {
      entrenado: { type: Boolean, default: false },
      fechaEntrenamiento: { type: Date, default: null },
      documentoOrigenNombre: { type: String, default: null },
      totalChunks: { type: Number, default: 0 },
    },
    activo: {
      type: Boolean,
      default: true, 
    },
  },
  { timestamps: true }
);

cursoSchema.index({ mentor: 1 });
cursoSchema.index({ estado: 1 });

const Curso = mongoose.model('Curso', cursoSchema, 'cursos');

export default Curso;