import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  constructor() {
    this.extractor = null;
  }

  /**
   * Inicializa el pipeline de feature-extraction (Singleton pattern).
   * La primera vez descargará el modelo all-MiniLM-L6-v2 y luego lo usará en caché local.
   */
  async obtenerExtractor() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.extractor;
  }

  /**
   * Recibe un texto y devuelve un array de 384 números flotantes (vector/embedding).
   */
  async generarEmbedding(texto) {
    const extractor = await this.obtenerExtractor();
    const output = await extractor(texto, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

export default new EmbeddingService();