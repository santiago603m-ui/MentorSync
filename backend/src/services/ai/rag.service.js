import groqProvider from './providers/groq.provider.js';
import embeddingService from '../embedding.service.js';
import knowledgeChunkRepository from '../../repositories/knowledgeChunk.repository.js';
import cursoService from '../course.service.js';
import { AppError } from '../../utils/AppError.js';

const LIMITE_CHUNKS = 5;

function armarPrompt(pregunta, chunks) {
  const contexto = chunks
    .map((chunk, indice) => `[Fragmento ${indice + 1}]\n${chunk.texto}`)
    .join('\n\n');

  const mensajeSistema = [
    'Eres el asistente de IA de un curso en la plataforma MentorSync AI.',
    'Responde ÚNICAMENTE con base en el CONTEXTO proporcionado, que viene del material del curso.',
    'Si la respuesta no está en el contexto, dilo claramente en vez de inventar información.',
    'Responde en español, de forma clara y concisa, en markdown cuando ayude a la claridad (listas, negritas).',
  ].join(' ');

  const mensajeUsuario = `CONTEXTO DEL CURSO:\n${contexto || '(sin contexto disponible)'}\n\nPREGUNTA DEL APRENDIZ:\n${pregunta}`;

  return [
    { role: 'system', content: mensajeSistema },
    { role: 'user', content: mensajeUsuario },
  ];
}

class RagService {
  /**
   * Punto de entrada del RAG: embebe la pregunta, trae los chunks relevantes
   * del curso (y SOLO de ese curso), arma el prompt y genera la respuesta.
   */
  async responderPregunta(cursoId, pregunta) {
    if (!pregunta || pregunta.trim().length < 3) {
      throw new AppError('La pregunta es demasiado corta', 400, 'BAD_REQUEST');
    }

    // Confirma que el curso exista antes de gastar embeddings/tokens
    await cursoService.obtenerCursoPorId(cursoId);

    const vectorPregunta = await embeddingService.generarEmbedding(pregunta);

    const chunksRelevantes = await knowledgeChunkRepository.buscarSimilares(
      cursoId,
      vectorPregunta,
      LIMITE_CHUNKS
    );

    if (chunksRelevantes.length === 0) {
      return {
        respuesta:
          'Este curso todavía no tiene material de entrenamiento suficiente para responder preguntas. Contacta a tu mentor.',
        fragmentosUsados: [],
      };
    }

    const mensajes = armarPrompt(pregunta, chunksRelevantes);
    const respuesta = await groqProvider.generarRespuesta(mensajes);

    return {
      respuesta,
      fragmentosUsados: chunksRelevantes.map((chunk) => ({
        documentId: chunk.documentId,
        score: chunk.score,
        vistaPrevia: chunk.texto.slice(0, 150),
      })),
    };
  }
}

export default new RagService();