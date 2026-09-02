import chatService from '../services/chat.service.js';

class ChatController {
  async enviarPregunta(req, res, next) {
    try {
      const { pregunta, threadId } = req.body;
      const resultado = await chatService.enviarPregunta(
        req.params.cursoId,
        req.usuario.id,
        pregunta,
        threadId
      );
      return res.status(200).json({
        success: true,
        message: 'Respuesta generada correctamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerHistorial(req, res, next) {
    try {
      const mensajes = await chatService.obtenerHistorial(req.params.threadId);
      return res.status(200).json({
        success: true,
        message: 'Historial obtenido correctamente',
        data: { mensajes },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();