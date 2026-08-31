// Punto de entrada del backend.
// Ver docs/03_BACKEND_GUIDELINES.md antes de modificar este archivo.
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const app = express();

// Seguridad y performance
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
// Express 4: req.query es escribible, así que express-mongo-sanitize
// limpia body, params Y query sin necesitar workaround.
app.use(mongoSanitize());
app.use(pinoHttp());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

// TODO: montar routes/ aquí (ver docs/01_ARCHITECTURE.md)
// TODO: conectar MongoDB Atlas (ver src/config)
// TODO: inicializar Socket.io (ver src/sockets)
// TODO: montar swagger-ui-express en /api-docs (ver docs/03_BACKEND_GUIDELINES.md)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MentorSync AI backend corriendo en puerto ${PORT}`));

module.exports = app;
