# ⚙️ Guía de Backend — Convenciones

## Módulos: ESM (no CommonJS)

`backend/package.json` tiene `"type": "module"`. Siempre `import`/`export` con extensión `.js`:

```js
// ✅ correcto
import User from '../models/user.model.js';
export default authService;

// ❌ no usar
const User = require('../models/user.model.js');
module.exports = authService;
```

## Manejo de errores

Services lanzan `AppError` (`utils/AppError.js`, `new AppError(message, statusCode)`). Controllers hacen `try { } catch (e) { next(e) }` y `middlewares/error.middleware.js` responde `{ success:false, error:{message} }` (oculta mensaje en 500).

## Validación de input

Usar `zod` v4 en `validators/` antes del service. El service nunca recibe datos sin validar.

Validators reales: `auth.validator.js` (`esquemaRegistro`, `esquemaInicioSesion`), `course.validator.js` (`esquemaCrearCurso`, `esquemaActualizarCurso`, `esquemaCambiarEstado` con `error:` no `errorMap`), `chat.validator.js` (`esquemaPregunta` con `threadId` UUID), `user.validator.js` (`esquemaCrearUsuario`, `esquemaCambiarRol`, `esquemaCambiarEstado`).

## Flujo de una request

```
Route → Middleware (auth + role) → validar (Zod) → Controller → Service → Repository → Model → MongoDB
```

- **Controller** solo valida shape HTTP y llama al Service.
- **Service** orquesta repositories/otros services.
- **Repository** única capa que toca Mongoose.

Controllers/Services reales: `auth, course (con inscribir/cancelar/generarEstructura), document, chat, user` + repositories espejo + `embedding`, `rag`, `groq.provider`.

## Formato estándar de respuesta API

```json
{ "success": true, "data": { }, "message": "Curso creado correctamente" }
```
Error: `{ "success": false, "error": { "message": "..." } }` (pasado por `manejarErrores`).

> `course.controller.js` ya fue unificado a `{ success, data, message }` (antes usaba `{exito, curso}` — corregido en 2026-09).

## Socket.io — reuniones en vivo

- Servidor HTTP creado con `createServer(app)` + `new Server(httpServer, {cors:{origin:'*'}})` en `server.js` (`httpServer.listen` reemplaza `app.listen`).
- Auth de socket reutiliza `JWT_SECRET`: `socket.handshake.auth.token` o header `Authorization: Bearer` → `jwt.verify` → `socket.usuario = {id, rol, email}`. Si falla, `next(new Error('Token...'))` rechaza la conexión.
- Rooms por `sesion:${liveSessionId}` (una sala por `LiveSession`). Eventos cliente→servidor con callback `{success, message, code, data}`:
  - `sala:unirse {liveSessionId}` → verifica `liveSessionService.obtenerPorId`, si `estado==='cancelada'` → 403, `socket.join(room)`, `agregarAsistente`, `socket.to(room).emit('sala:usuario_unido')`.
  - `sala:mensaje {liveSessionId, contenido}` → verifica `socket.rooms.has(room)` (debe haberse unido), valida 1-2000 chars, `liveSessionService.obtenerPorId` → `chatMessageRepository.crear({courseId, liveSessionId, remitenteId, rolRemitente, contenido, esRespuestaBot:false})` → `io.to(room).emit('sala:mensaje_nuevo', payload)`.
  - `sala:escribiendo {liveSessionId, escribiendo}` → `socket.to(room).emit('sala:escribiendo')`.
  - `sala:abandonar {liveSessionId}` → `socket.leave(room)` + `sala:usuario_salio`.
  - `bot_activado {liveSessionId}` → broadcast `bot_activado` (mentor desconectado, IA toma relevo).
- `disconnect` → para cada `liveSessionId` en `socket.data.sesiones`, broadcast `sala:usuario_salio` y si `rol==='mentor'` también `mentor_desconectado` (permite al frontend mostrar aviso y activar el bot).
- Validación de mensajes con `esquemaMensajeSala` (Zod) en frontend y `trim().length` en socket; `liveSession` estados `programada|en_curso|finalizada|cancelada` validados por `esquemaCambiarEstadoSesion`.

## Pagos PayU (`services/payments/`)

1. El precio, moneda y usuario se toman del servidor; el cliente nunca envía el monto.
2. `payu.provider.js` encapsula URLs sandbox/producción, armado del formulario HTML, firma MD5 y validación del webhook.
3. `POST /api/pagos/confirmacion` es público, usa `application/x-www-form-urlencoded` y solo procesa merchants/firmas válidos.
4. La confirmación compara monto y moneda con el snapshot de `pagos`; una referencia aprobada es terminal.
5. `PaymentRepository.reclamarInscripcion` usa compare-and-set (`inscripcionAplicada:false → true`) para que una sola confirmación aplique la inscripción.
6. `POST /api/cursos/:id/inscribir` solo permite cursos gratuitos; uno de precio `> 0` devuelve 402 `PAYMENT_REQUIRED`.
7. El frontend nunca interpreta parámetros de la respuesta de PayU: consulta `GET /api/pagos/estado/:referencia` autenticado.

## Control de acceso por rol (RBAC)

```js
// middlewares/role.middleware.js
const requireRole = (...roles) => (req,res,next) => {
  if (!roles.includes(req.user.rol)) return next(new AppError('No tienes permiso', 403));
  next();
};
// uso:
router.post('/cursos', verificarToken, verificarRol('mentor','administrador'), courseController.crearCurso);
```

Además `course.service.verificarPropiedad(curso, mentorId, rol)` hace bypass si `rol==='administrador'`; si no, compara `curso.mentor` vs `mentorId` y lanza 403. User admin (`/api/usuarios`) es `router.use(verificarToken, verificarRol('administrador'))` + anti auto-cambio en `user.service` (`cambiarRol`/`cambiarEstado` compara `solicitanteId`).

Roles en `users.rol`: siempre minúsculas español (`aprendiz|mentor|administrador`).

## Reglas para el módulo de IA (`services/ai/`)

1. Nunca llamar a Groq desde un controller — siempre vía `rag.service.js` o `course.service.generarEstructuraCurso`.
2. Toda `$vectorSearch` DEBE filtrar por `courseId` (store lógico por curso).
3. El pipeline PDF **es síncrono dentro del request** (`document.service.subirDocumento`): multer → Cloudinary `raw` → `pdf-parse` → `fragmentarTexto(1000,200)` → embeddings → `guardarLote`. Futuro: extraer a Bull/BullMQ para PDFs >10 MB (hoy `src/jobs/` vacío).
4. Nuevo proveedor de IA implementa `IAssistantProvider` (ver `assistant-provider.interface.js`) — `rag.service` y `generarEstructuraCurso` solo conocen la interfaz.

## Nomenclatura

- Archivos: `kebab-case` (`course.service.js`)
- Clases: `PascalCase`
- Variables: `camelCase`
- Colecciones Mongo: plural (`cursos`, `usuarios`, `knowledgechunks`, `chatmessages`)

## Logging

`pino` + `pino-http` (JSON, `pino-pretty` en dev). Usar `req.log` inyectado por `pinoHttp()`, no `console.log`.

## Documentación de API (Swagger)

`swagger-jsdoc` + `swagger-ui-express` instalados pero no montados (`// TODO` en `server.js` → `/api-docs` pendiente). No dejar endpoints nuevos sin bloque `@openapi` (hoy ninguno tiene).

## Seguridad en `server.js`

`helmet`, `cors`, `compression`, `express.json()`, `express-mongo-sanitize`, `pinoHttp()`, `express-rate-limit` (300/15min) montados globales antes de `app.use('/api/...')`. Rutas montadas: `/api/auth`, `/api/usuarios`, `/api/cursos` (×3: course, document, chat). El middleware `manejarErrores` va al final.

## Variables de entorno (`.env`)

```
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
GROQ_MODEL=
BACKEND_URL=
FRONTEND_URL=
PAYU_ENV=test
PAYU_API_KEY=
PAYU_MERCHANT_ID=
PAYU_ACCOUNT_ID=
PAYU_CONFIRMATION_URL=
PAYU_TAX=0
PAYU_TAX_RETURN_BASE=0
```

`scripts/check-setup.js` valida 13 variables: las 8 generales existentes más `PAYU_API_KEY`, `PAYU_MERCHANT_ID`, `PAYU_ACCOUNT_ID`, `BACKEND_URL` y `FRONTEND_URL`. `PAYU_ENV` es opcional y usa `test` por defecto. Correr `npm run check-setup` antes de levantar el server.

Engines: `node >=24.20.0`. Deps nuevas: `sharp@0.35.4`, `validator@13.15.35`.
