import { randomUUID } from 'crypto';
import ragService from './ai/rag.service.js';
import chatMessageRepository from '../repositories/chatMessage.repository.js';
import cursoService from './course.service.js';
import { AppError } from '../utils/AppError.js';

class ChatService {
  async enviarPregunta(cursoId, aprendizId, pregunta, threadId) {
    const curso = await cursoService.obtenerCursoPorId(cursoId);

    if (curso.estado !== 'publicado') {
      throw new AppError('Este curso no está publicado todavía', 403, 'COURSE_NOT_PUBLISHED');
    }

    // Si no viene threadId, es el primer mensaje de una conversación nueva.
    const threadIdFinal = threadId || randomUUID();

    await chatMessageRepository.crear({
      courseId: cursoId,
      threadId: threadIdFinal,
      remitenteId: aprendizId,
      rolRemitente: 'aprendiz',
      contenido: pregunta,
      esRespuestaBot: false,
    });

    const { respuesta, fragmentosUsados } = await ragService.responderPregunta(cursoId, pregunta);

    const mensajeBot = await chatMessageRepository.crear({
      courseId: cursoId,
      threadId: threadIdFinal,
      remitenteId: null, // null = lo envió el bot, no un usuario
      rolRemitente: 'bot',
      contenido: respuesta,
      esRespuestaBot: true,
    });

    return {
      threadId: threadIdFinal,
      respuesta,
      mensajeId: mensajeBot._id,
      fragmentosUsados,
    };
  }

  async obtenerHistorial(threadId) {
    return chatMessageRepository.listarPorThread(threadId);
  }
}

export default new ChatService();