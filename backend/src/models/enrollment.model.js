const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
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

module.exports = mongoose.model('Enrollment', enrollmentSchema);
