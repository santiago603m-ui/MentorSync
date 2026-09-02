import mongoose from 'mongoose';
import KnowledgeChunk from '../models/knowledgeChunk.model.js';

class KnowledgeChunkRepository {
  async guardarLote(chunks) {
    return KnowledgeChunk.insertMany(chunks);
  }

  async buscarPorDocumento(documentId) {
    return KnowledgeChunk.find({ documentId });
  }

  async eliminarPorDocumento(documentId) {
    return KnowledgeChunk.deleteMany({ documentId });
  }

  /**
   * Búsqueda semántica sobre knowledgechunks vía Atlas $vectorSearch.
   * El filtro por courseId es OBLIGATORIO (regla de 00_PROJECT_CONTEXT.md):
   * evita que el bot de un curso "vea" contenido de otro curso.
   */
  async buscarSimilares(courseId, vectorPregunta, limite = 5) {
    return KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: vectorPregunta,
          numCandidates: Math.max(limite * 20, 100),
          limit: limite,
          filter: { courseId: new mongoose.Types.ObjectId(courseId) },
        },
      },
      {
        $project: {
          texto: 1,
          metadata: 1,
          documentId: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);
  }
}

export default new KnowledgeChunkRepository();