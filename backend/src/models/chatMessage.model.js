const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  threadId: {
    type: String,
    index: true // UUID o similar para agrupar sesiones del bot
  },
  liveSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession' // Nulo si es una charla directa con el bot fuera de sesión
  },
  remitenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Quién lo envió (puede ser nulo si fue el bot)
  },
  rolRemitente: {
    type: String,
    enum: ['aprendiz', 'mentor', 'bot'],
    required: true
  },
  contenido: { type: String, required: true },
  esRespuestaBot: { type: Boolean, default: false }
}, {
  timestamps: true // createdAt funciona como timestamp del mensaje
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
