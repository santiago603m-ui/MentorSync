import Groq from 'groq-sdk';
import { IAssistantProvider } from './assistant-provider.interface.js';
import { AppError } from '../../../utils/AppError.js';

const MODELO_POR_DEFECTO = process.env.GROQ_MODEL;

class GroqProvider extends IAssistantProvider {
  constructor() {
    super();
    // El cliente se crea perezosamente en el primer uso, no al importar el
    // módulo — así el server puede levantar aunque GROQ_API_KEY todavía no
    // esté configurada (es opcional según 03_BACKEND_GUIDELINES.md).
    this.cliente = null;
  }

  obtenerCliente() {
    if (!process.env.GROQ_API_KEY) {
      throw new AppError(
        'GROQ_API_KEY no está configurada, el asistente de IA no puede responder',
        503,
        'GROQ_NOT_CONFIGURED'
      );
    }
    if (!this.cliente) {
      this.cliente = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this.cliente;
  }

  async generarRespuesta(mensajes, opciones = {}) {
    const cliente = this.obtenerCliente();

    try {
      const respuesta = await cliente.chat.completions.create({
        model: opciones.modelo || MODELO_POR_DEFECTO,
        messages: mensajes,
        temperature: opciones.temperatura ?? 0.3,
        max_tokens: opciones.maxTokens ?? 1024,
      });

      const contenido = respuesta.choices?.[0]?.message?.content?.trim();
      if (!contenido) {
        throw new AppError('Groq devolvió una respuesta vacía', 502, 'GROQ_EMPTY_RESPONSE');
      }
      return contenido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('El asistente de IA no pudo generar una respuesta', 502, 'GROQ_REQUEST_FAILED');
    }
  }
}

export default new GroqProvider();