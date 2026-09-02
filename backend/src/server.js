import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import authRoutes from './routes/auth.routes.js';
import cursoRoutes from './routes/course.routes.js';
import documentRoutes from './routes/document.routes.js';
import { manejarErrores } from './middlewares/error.middleware.js';
import { conectarBaseDatos } from './config/database.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();

// Seguridad y performance
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(mongoSanitize());
app.use(pinoHttp());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/cursos', documentRoutes);
app.use('/api/cursos', chatRoutes);

// TODO: inicializar Socket.io (ver src/sockets)
// TODO: montar swagger-ui-express en /api-docs (ver docs/03_BACKEND_GUIDELINES.md)

// El middleware de errores SIEMPRE va al final, después de todas las rutas
app.use(manejarErrores);

const PORT = process.env.PORT || 4000;

/**
 * Arranca el servidor SOLO después de conectar a MongoDB — así ninguna
 * request llega a un controller que intente usar la base de datos
 * antes de que esté lista.
 */
async function iniciarServidor() {
  try {
    await conectarBaseDatos();
    app.listen(PORT, () => console.log(`🚀 MentorSync AI backend corriendo en puerto ${PORT}`));
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciarServidor();

export default app;
