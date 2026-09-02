import cursoService from '../services/course.service.js';

class CourseController {
  async crearCurso(req, res, next) {
    try {
      const curso = await cursoService.crearCurso(req.usuario.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Curso creado correctamente',
        data: { curso },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerCurso(req, res, next) {
    try {
      const curso = await cursoService.obtenerCursoPorId(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Curso obtenido correctamente',
        data: { curso },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarCursosPublicados(req, res, next) {
    try {
      const pagina = Number(req.query.pagina) || 1;
      const limite = Number(req.query.limite) || 12;
      const cursos = await cursoService.listarCursosPublicados({ pagina, limite });
      return res.status(200).json({
        success: true,
        message: 'Cursos obtenidos correctamente',
        data: { cursos },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarMisCursos(req, res, next) {
    try {
      const cursos = await cursoService.listarCursosDeMentor(req.usuario.id);
      return res.status(200).json({
        success: true,
        message: 'Tus cursos fueron obtenidos correctamente',
        data: { cursos },
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarCurso(req, res, next) {
    try {
      const curso = await cursoService.actualizarCurso(req.params.id, req.usuario.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Curso actualizado correctamente',
        data: { curso },
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstadoCurso(req, res, next) {
    try {
      const curso = await cursoService.cambiarEstado(req.params.id, req.usuario.id, req.body.estado);
      return res.status(200).json({
        success: true,
        message: 'Estado del curso actualizado correctamente',
        data: { curso },
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminarCurso(req, res, next) {
    try {
      await cursoService.eliminarCurso(req.params.id, req.usuario.id);
      return res.status(200).json({
        success: true,
        message: 'Curso eliminado correctamente',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CourseController();