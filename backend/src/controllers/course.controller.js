import mongoose from 'mongoose';
import cursoService from '../services/course.service.js';
import Usuario from '../models/user.model.js'; // 👈 importa tu modelo de usuario

class CourseController {
  async crearCurso(req, res, next) {
    try {
      // 👇 Buscamos el usuario para obtener su nombre, igual que en inscribirCurso
      const usuario = await Usuario.findById(req.usuario.id).select('nombre');
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null,
        });
      }

      // 👇 Le pasamos al service un objeto { id, nombre } en vez del id plano
      const curso = await cursoService.crearCurso(
        { id: req.usuario.id, nombre: usuario.nombre },
        req.body
      );

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

  async inscribirCurso(req, res) {
    try {
      const cursoId = req.params.id;

      // 👇 Validar que el ID sea un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(cursoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido',
          data: null,
        });
      }

      const usuarioId = req.usuario.id; // viene del token

      // 👇 Buscar datos del usuario (nombre y correo)
      const usuario = await Usuario.findById(usuarioId).select('nombre email');
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null,
        });
      }

      // 👇 Pasar también nombre y correo al service
      const curso = await cursoService.inscribirAprendiz(cursoId, {
        id: usuarioId,
        nombre: usuario.nombre,
        correo: usuario.email,
      });

      if (!curso) {
        return res.status(404).json({
          success: false,
          message: 'Curso no encontrado',
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Inscripción exitosa',
        data: { curso, aprendiz: usuario },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Error al inscribirse',
        data: null,
      });
    }
  }

  async cancelarInscripcion(req, res) {
    try {
      const cursoId = req.params.id;
      const inscritoId = req.params.inscritoId; // 👈 viene del array

      const curso = await cursoService.cancelarInscripcion(cursoId, inscritoId);

      if (!curso) {
        return res.status(404).json({
          success: false,
          message: 'Curso o inscripción no encontrada',
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Inscripción cancelada',
        data: { curso },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Error al cancelar inscripción',
        data: null,
      });
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

  async subirImagenCurso(req, res, next) {
    try {
      const curso = await cursoService.subirImagenCurso(req.params.id, req.usuario.id, req.file.path);
      return res.status(200).json({
        success: true,
        message: 'Imagen del curso actualizada correctamente',
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

  async generarEstructura(req, res, next) {
    try {
      const curso = await cursoService.generarEstructuraCurso(req.params.id, req.usuario.id);
      return res.status(200).json({
        success: true,
        message: 'Estructura del curso generada con éxito',
        data: { curso },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CourseController();