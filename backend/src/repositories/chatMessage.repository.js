import ChatMessage from '../models/chatMessage.model.js';

class ChatMessageRepository {
  async crear(datosMensaje) {
    return ChatMessage.create(datosMensaje);
  }

  async listarPorThread(threadId) {
    return ChatMessage.find({ threadId }).sort({ createdAt: 1 });
  }

  async listarPorCurso(courseId, limite = 50) {
    return ChatMessage.find({ courseId }).sort({ createdAt: -1 }).limit(limite);
  }
}

export default new ChatMessageRepository();