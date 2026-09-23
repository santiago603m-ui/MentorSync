import liveSessionRepository from '../repositories/liveSession.repository.js';
import cursoService from './course.service.js';
import { AppError } from '../utils/AppError.js';

class LiveSessionService {
  async crearSesion({ courseId, mentorId, titulo, fechaInicioProgramada, urlReunion, rol }) {
    const curso = await cursoService.obtenerCursoPorId(courseId);

    // Solo el mentor dueño o un administrador pueden crear sesiones para el curso
    if (rol !== 'administrador') {
      const idMentor = curso.mentor._id ? curso.mentor._id.toString() : curso.mentor.toString();
      if (idMentor !== mentorId.toString()) {
        throw new AppError('No tienes permiso para crear sesiones en este curso', 403, 'FORBIDDEN');
      }
    }

    return liveSessionRepository.crear({
      courseId,
      mentorId,
      titulo,
      fechaInicioProgramada: new Date(fechaInicioProgramada),
      urlReunion: urlReunion || undefined,
      estado: 'programada',
      asistentes: [],
    });
  }

  async listarPorCurso(courseId) {
    // Valida que el curso exista
    await cursoService.obtenerCursoPorId(courseId);
    return liveSessionRepository.listarPorCurso(courseId);
  }

  async obtenerPorId(id) {
    const sesion = await liveSessionRepository.buscarPorId(id);
    if (!sesion) throw new AppError('Sesión no encontrada', 404, 'NOT_FOUND');
    return sesion;
  }

  async cambiarEstado(id, mentorId, estado, rol) {
    const sesion = await this.obtenerPorId(id);

    if (rol !== 'administrador') {
      if (sesion.mentorId._id ? sesion.mentorId._id.toString() !== mentorId.toString() : sesion.mentorId.toString() !== mentorId.toString()) {
        throw new AppError('No tienes permiso sobre esta sesión', 403, 'FORBIDDEN');
      }
    }

    const cambios = { estado };
    if (estado === 'en_curso' && !sesion.fechaInicioReal) {
      cambios.fechaInicioReal = new Date();
    }
    if (estado === 'finalizada' && !sesion.fechaFin) {
      cambios.fechaFin = new Date();
    }

    return liveSessionRepository.actualizar(id, cambios);
  }

  async unirse(id, usuarioId) {
    await this.obtenerPorId(id);
    return liveSessionRepository.agregarAsistente(id, usuarioId);
  }
}

export default new LiveSessionService();
