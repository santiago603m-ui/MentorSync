import Curso from '../models/course.model.js';

// Repository Pattern: única capa que conoce Mongoose.
// El service nunca debe importar el modelo directamente.
class CursoRepository {
  async crear(datosCurso) {
    return Curso.create(datosCurso);
  }

  async buscarPorId(id) {
    return Curso.findOne({ _id: id, activo: true }).populate('mentor', 'nombre email');
  }

  async listarPublicados({ pagina = 1, limite = 12 } = {}) {
    const salto = (pagina - 1) * limite;
    return Curso.find({ estado: 'publicado', activo: true })
      .populate('mentor', 'nombre')
      .sort({ createdAt: -1 })
      .skip(salto)
      .limit(limite);
  }

  async listarPorMentor(mentorId) {
    return Curso.find({ mentor: mentorId, activo: true }).sort({ createdAt: -1 });
  }

  async actualizar(id, cambios) {
    return Curso.findOneAndUpdate({ _id: id, activo: true }, cambios, {
      new: true,
      runValidators: true,
    });
  }

  async eliminarLogico(id) {
    return Curso.findOneAndUpdate({ _id: id }, { activo: false }, { new: true });
  }

  // Usado por el futuro pipeline RAG cuando termine de generar embeddings
  async marcarBotEntrenado(id, { totalChunks, documentoOrigenNombre }) {
    return Curso.findByIdAndUpdate(
      id,
      {
        'bot.entrenado': true,
        'bot.fechaEntrenamiento': new Date(),
        'bot.totalChunks': totalChunks,
        'bot.documentoOrigenNombre': documentoOrigenNombre,
      },
      { new: true }
    );
  }
}

export default new CursoRepository();