# ⚙️ Guía de Backend — Convenciones

## Módulos: ESM (no CommonJS)

`backend/package.json` tiene `"type": "module"`. Todo el código del backend se escribe con `import`/`export`, nunca `require()`/`module.exports`:

```js
// ✅ correcto
import User from '../models/user.model.js';
export default authService;

// ❌ no usar
const User = require('../models/user.model.js');
module.exports = authService;
```

Nota: en imports relativos de ESM en Node, la extensión `.js` es obligatoria (`'../models/user.model.js'`, no `'../models/user.model'`).

## Manejo de errores

Los servicios lanzan errores usando la clase `AppError` (`utils/AppError.js`), que incluye `statusCode`. Nunca `throw new Error('mensaje')` a secas — el middleware de errores centralizado necesita el código HTTP:

```js
// utils/AppError.js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// en un service:
if (usuarioExistente) {
  throw new AppError('El correo ya se encuentra registrado', 409);
}
```

Los controllers no traducen errores a códigos HTTP — solo hacen `try { ... } catch (error) { next(error) }`, y `middlewares/error.middleware.js` lee `error.statusCode || 500`.

## Validación de input

Usar `zod` en `validators/` para validar `req.body` **antes** de que llegue al service — nunca confiar en que el frontend ya validó. Un service nunca debe recibir datos sin validar del controller.

## Flujo de una request

```
Route → Middleware (auth + role) → Controller → Service → Repository → Model → MongoDB
```

- El **Controller** nunca contiene lógica de negocio, solo valida el request (delega a `validators/`), llama al `Service` correspondiente y da forma a la respuesta.
- El **Service** contiene la lógica de negocio y orquesta repositorios/otros servicios.
- El **Repository** es el único lugar que habla directamente con Mongoose.

## Formato estándar de respuesta API

```json
{
  "success": true,
  "data": { },
  "message": "Curso creado correctamente"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "El curso no existe"
  }
}
```

Todos los errores pasan por `middlewares/error.middleware.js` — no usar `try/catch` con `res.json` disperso en cada controller; usar `next(error)` y dejar que el middleware centralice el formato.

## Control de acceso por rol (RBAC)

```js
// middlewares/role.middleware.js
const requireRole = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.rol)) {
    return next(new ForbiddenError('No tienes permiso para esta acción'));
  }
  next();
};

// uso en routes:
router.post('/courses', auth, requireRole('mentor', 'administrador'), courseController.create);
```

## Reglas para el módulo de IA (`services/ai/`)

1. Nunca llamar a la API de Groq directamente desde un controller — siempre a través de `rag.service.js`.
2. Toda búsqueda de contexto (`$vectorSearch`) DEBE filtrar por `courseId`. No exponer un endpoint que busque en todos los cursos a la vez.
3. El procesamiento de PDFs (chunking + embeddings) va en `jobs/`, nunca de forma síncrona en el request de subida del archivo — el mentor sube el PDF y recibe respuesta inmediata; el procesamiento ocurre en background.
4. Cualquier nuevo proveedor de IA debe implementar la interfaz `IAssistantProvider` (ver `01_ARCHITECTURE.md`) — no acoplar el código de negocio al SDK de Groq directamente.

## Nomenclatura

- Archivos: `kebab-case` (`course.service.js`)
- Clases: `PascalCase`
- Variables/funciones: `camelCase`
- Colecciones de MongoDB: `camelCase` en plural (`knowledgeChunks`, `chatMessages`)
- Roles almacenados en `users.rol`: siempre en minúsculas y en español (`"aprendiz"`, `"mentor"`, `"administrador"`) — no mezclar con inglés en otras partes del código.

## Logging

Se usa `pino` + `pino-http`, nunca `console.log` ni `morgan`. En desarrollo, `pino-pretty` formatea la salida de forma legible (ya está en `devDependencies`):

```js
// server.js
const pinoHttp = require('pino-http');
app.use(pinoHttp());
```

Dentro de servicios/controllers, usar el logger inyectado por `pino-http` (`req.log`) en vez de instanciar un logger nuevo cada vez.

## Documentación de API (Swagger)

Los endpoints se documentan con comentarios JSDoc que `swagger-jsdoc` lee para generar el spec OpenAPI, servido con `swagger-ui-express` en `/api-docs`:

```js
/**
 * @openapi
 * /courses:
 *   post:
 *     summary: Crea un curso nuevo
 *     tags: [Courses]
 */
router.post('/courses', ...);
```

No dejar endpoints nuevos sin su bloque `@openapi` — la doc de Swagger es la referencia que se usa para probar la API mientras se desarrolla el frontend.

## Seguridad aplicada en `server.js`

`helmet` (headers seguros), `cors`, `compression`, `express-mongo-sanitize` (previene NoSQL injection en `req.body`, `req.query` y `req.params` — en Express 4 los tres son escribibles, así que el paquete funciona sin workarounds) y `express-rate-limit` van montados como middlewares globales antes de las rutas. No remover ninguno sin justificarlo aquí.

## Variables de entorno esperadas (`.env`)

```
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Nota:** `GROQ_API_KEY` se usará cuando se implemente el chatbot RAG (el SDK ya está instalado), pero no es obligatoria por ahora.

Antes de levantar el servidor, correr `npm run check-setup` (`scripts/check-setup.js`) para validar que todas estén presentes. ⚠️ **El script actual está desactualizado** — valida `GROQ_API_KEY` (que ya no está en `.env.example`) pero no valida las de Cloudinary (que sí son obligatorias desde que se implementó el módulo de documentos).
