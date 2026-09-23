import LiveSession from '../models/liveSession.model.js';

class LiveSessionRepository {
  async crear(datos) {
    return LiveSession.create(datos);
  }

  async buscarPorId(id) {
    return LiveSession.findById(id)
      .populate('courseId', 'titulo categoria mentor estado')
      .populate('mentorId', 'nombre email');
  }

  async listarPorCurso(courseId) {
    return LiveSession.find({ courseId }).sort({ fechaInicioProgramada: 1 });
  }

  async listarTodas({ pagina = 1, limite = 20 } = {}) {
    const salto = (pagina - 1) * limite;
    const [sesiones, total] = await Promise.all([
      LiveSession.find().sort({ createdAt: -1 }).skip(salto).limit(limite).populate('courseId', 'titulo').populate('mentorId', 'nombre'),
      LiveSession.countDocuments(),
    ]);
    return { sesiones, total, pagina, limite };
  }

  async actualizar(id, cambios) {
    return LiveSession.findByIdAndUpdate(id, cambios, { new: true, runValidators: true });
  }

  async agregarAsistente(id, usuarioId) {
    return LiveSession.findByIdAndUpdate(
      id,
      { $addToSet: { asistentes: usuarioId } },
      { new: true }
    );
  }
}

export default new LiveSessionRepository();
