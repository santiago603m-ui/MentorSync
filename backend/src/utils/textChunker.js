export function fragmentarTexto(texto, chunkSize = 1000, overlap = 200) {
  if (!texto) return [];
  
  // Limpiamos espacios extra y saltos de línea irregulares
  const textoLimpio = texto.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;

  while (i < textoLimpio.length) {
    chunks.push(textoLimpio.slice(i, i + chunkSize));
    // Avanzamos el tamaño del chunk menos el overlap para cruzar contextos
    i += chunkSize - overlap;
  }

  return chunks;
}