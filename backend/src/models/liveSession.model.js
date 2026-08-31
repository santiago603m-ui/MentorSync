const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
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
  titulo: { type: String, required: true },
  estado: {
    type: String,
    enum: ['programada', 'en_curso', 'finalizada', 'cancelada'],
    default: 'programada'
  },
  fechaInicioProgramada: { type: Date, required: true },
  fechaInicioReal: { type: Date },
  fechaFin: { type: Date },
  urlReunion: { type: String },
  transcript: { type: String }, // Opcional: si se logra grabar y transcribir luego
  asistentes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('LiveSession', liveSessionSchema);
