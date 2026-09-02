import cursoRepository from '../repositories/course.repository.js';
import { AppError } from '../utils/AppError.js';

class CursoService {
  async crearCurso(mentorId, datosCurso) {
    return cursoRepository.crear({ ...datosCurso, mentor: mentorId });
  }

  async obtenerCursoPorId(id) {
    const curso = await cursoRepository.buscarPorId(id);
    if (!curso) {
      throw new AppError('Curso no encontrado', 404);
    }
    return curso;
  }

  async listarCursosPublicados(opcionesPaginacion) {
    return cursoRepository.listarPublicados(opcionesPaginacion);
  }

  async listarCursosDeMentor(mentorId) {
    return cursoRepository.listarPorMentor(mentorId);
  }

  async actualizarCurso(id, mentorId, cambios) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.actualizar(id, cambios);
  }

  async cambiarEstado(id, mentorId, estado) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.actualizar(id, { estado });
  }

  async eliminarCurso(id, mentorId) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.eliminarLogico(id);
  }

  // Un mentor solo puede modificar sus propios cursos.
  // El rol "administrador" se maneja aparte, vía verificarRol en la ruta.
  verificarPropiedad(curso, mentorId) {
    const idDelMentor = curso.mentor._id ? curso.mentor._id.toString() : curso.mentor.toString();
    if (idDelMentor !== mentorId.toString()) {
      throw new AppError('No tienes permiso sobre este curso', 403);
    }
  }
}

export default new CursoService();