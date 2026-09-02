import mongoose from 'mongoose';

/**
 * Conecta a MongoDB Atlas usando MONGODB_URI.
 * Se llama una sola vez, antes de levantar el servidor Express
 * (ver server.js) — así ninguna request llega antes de tener conexión.
 */
export async function conectarBaseDatos() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
  }

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB conectado');
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ Error de conexión a MongoDB:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconectado');
  });

  await mongoose.connect(uri);
}
