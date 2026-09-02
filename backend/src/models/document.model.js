import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombreOriginal: { type: String, required: true },
  fileUrl: { 
    type: String, 
    required: function() {
      return this.estado !== 'pendiente';
    } 
  },
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
  errorMessage: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('Document', documentSchema);