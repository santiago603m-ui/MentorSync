// Strategy Pattern: cualquier proveedor de IA nuevo (OpenAI, Anthropic, otro
// modelo open-weight, etc.) debe extender esta clase e implementar
// generarRespuesta(). rag.service.js solo conoce esta interfaz, nunca el SDK
// concreto de un proveedor — así se puede cambiar de proveedor sin tocar
// la lógica de negocio del RAG.
export class IAssistantProvider {
  /**
   * @param {Array<{role: string, content: string}>} mensajes - formato tipo chat (system/user/assistant)
   * @param {object} opciones - modelo, temperatura, maxTokens, etc.
   * @returns {Promise<string>} el texto de la respuesta generada
   */
  // eslint-disable-next-line no-unused-vars
  async generarRespuesta(mensajes, opciones = {}) {
    throw new Error('generarRespuesta() debe ser implementado por la subclase');
  }
}