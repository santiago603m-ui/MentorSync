import mongoose from 'mongoose';
import liveSessionService from '../services/liveSession.service.js';
import chatMessageRepository from '../repositories/chatMessage.repository.js';

class LiveSessionController {
  async crear(req, res, next) {
    try {
      const sesion = await liveSessionService.crearSesion({
        courseId: req.body.courseId,
        mentorId: req.usuario.id,
        titulo: req.body.titulo,
        fechaInicioProgramada: req.body.fechaInicioProgramada,
        urlReunion: req.body.urlReunion,
        rol: req.usuario.rol,
      });
      return res.status(201).json({ success: true, message: 'Sesión creada correctamente', data: { sesion } });
    } catch (error) {
      next(error);
    }
  }

  async listarPorCurso(req, res, next) {
    try {
      const { cursoId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(cursoId)) {
        return res.status(400).json({ success: false, message: 'ID de curso inválido', data: null });
      }
      const sesiones = await liveSessionService.listarPorCurso(cursoId);
      return res.status(200).json({ success: true, message: 'Sesiones obtenidas', data: { sesiones } });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de sesión inválido', data: null });
      }
      const sesion = await liveSessionService.obtenerPorId(id);
      return res.status(200).json({ success: true, message: 'Sesión obtenida', data: { sesion } });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de sesión inválido', data: null });
      }
      const sesion = await liveSessionService.cambiarEstado(id, req.usuario.id, req.body.estado, req.usuario.rol);
      return res.status(200).json({ success: true, message: 'Estado actualizado', data: { sesion } });
    } catch (error) {
      next(error);
    }
  }

  async listarMensajes(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de sesión inválido', data: null });
      }
      await liveSessionService.obtenerPorId(id); // valida que exista
      const mensajes = await chatMessageRepository.listarPorSesion(id);
      return res.status(200).json({ success: true, message: 'Mensajes de la sesión', data: { mensajes } });
    } catch (error) {
      next(error);
    }
  }
}

export default new LiveSessionController();
