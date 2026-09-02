const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  texto: { type: String, required: true },
  embedding: {
    type: [Number], // Array de números (384 dimensiones con Xenova/all-MiniLM-L6-v2)
    required: true
  },
  metadata: {
    pagina: { type: Number },
    seccion: { type: String }
  }
}, {
  timestamps: true
});

// El índice de Vector Search sobre "embedding" se crea en MongoDB Atlas,
// no mediante Mongoose (ver 04_DATABASE_SCHEMA.md).

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
