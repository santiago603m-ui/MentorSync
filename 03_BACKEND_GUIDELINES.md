# ⚙️ Guía de Backend — Convenciones

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
GROQ_API_KEY=
```

Antes de levantar el servidor, correr `npm run check-setup` (`scripts/check-setup.js`) para validar que todas estén presentes.
