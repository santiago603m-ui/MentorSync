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

  async inscribirAprendiz(cursoId, aprendiz) {
    return Curso.findByIdAndUpdate(
      cursoId,
      { $addToSet: { inscritos: aprendiz } }, // 👈 guarda id, nombre y correo
      { new: true }
    ).populate('mentor', 'nombre email');
  }

  async cancelarInscripcion(cursoId, inscritoId) {
    return Curso.findByIdAndUpdate(
      cursoId,
      { $pull: { inscritos: { _id: inscritoId } } }, // 👈 elimina por _id del array
      { new: true }
    ).populate('mentor', 'nombre email');
  }


  async listarPublicados({ pagina = 1, limite = 12 } = {}) {
    const salto = (pagina - 1) * limite;
    console.log('Buscando cursos publicados...', { pagina, limite, salto });
    const cursos = await Curso.find({ estado: 'publicado', activo: true })
      .populate('mentor', 'nombre')
      .sort({ createdAt: -1 })
      .skip(salto)
      .limit(limite);
    console.log('Cursos encontrados:', cursos);
    return cursos;
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

  // Actualizar imagen del curso (el esquema usa "portadaUrl", no "imagen")
  async actualizarImagen(cursoId, imagenData) {
    return Curso.findByIdAndUpdate(
      cursoId,
      { portadaUrl: imagenData },
      { new: true }
    ).populate('mentor', 'nombre email');
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