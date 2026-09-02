import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'completado', 'suspendido'],
    default: 'activo'
  },
  progreso: { type: Number, default: 0 } // Porcentaje 0-100
}, {
  timestamps: true
});

// Un usuario solo puede inscribirse una vez al mismo curso
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
