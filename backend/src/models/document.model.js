const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombreOriginal: { type: String, required: true },
  fileUrl: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['pdf', 'txt', 'enlace'],
    default: 'pdf'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'procesando', 'completado', 'error'],
    default: 'pendiente'
  },
  errorMessage: { type: String } // Si falla el job, se guarda el motivo aquí
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
