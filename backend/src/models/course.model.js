import mongoose from 'mongoose';

// Subesquema para las lecciones de cada módulo
const leccionSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String, required: true }, // Explicación didáctica generada por la IA
  puntosClave: [String],
  orden: { type: Number, default: 0 }
});

// Subesquema para los módulos del curso
const moduloSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  orden: { type: Number, default: 0 },
  lecciones: [leccionSchema]
});

const inscritoSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  nombre: { type: String, required: true },
  correo: { type: String, required: true }
}, { _id: true });

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
    // NUEVO: Almacena el texto extraído del PDF para que Groq lo procese
    contenidoTextoPlano: {
      type: String,
      default: null,
    },
    // NUEVO: Almacena la estructura tipo Platzi generada por la IA
    modulos: [moduloSchema],
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
    inscritos: [inscritoSchema]

  },
  { timestamps: true }
);

cursoSchema.index({ mentor: 1 });
cursoSchema.index({ estado: 1 });

const Curso = mongoose.model('Curso', cursoSchema, 'cursos');

export default Curso;
