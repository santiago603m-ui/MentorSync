# 📚 Referencia de Modelos, Repositorios, Services y Métodos — Backend

> Este documento es la referencia técnica detallada de cada archivo del backend con lógica: qué campos tiene cada modelo de Mongoose, y qué hace cada método de cada repository/service/controller/middleware/validator.
> Es un documento "vivo": cada vez que se agregue o modifique un método en `backend/src/`, actualizar la entrada correspondiente aquí.
> Para el diseño general de colecciones y el pipeline RAG, ver `04_DATABASE_SCHEMA.md`. Para las convenciones de arquitectura, ver `03_BACKEND_GUIDELINES.md`.

---

## Índice

1. [Modelos (Mongoose)](#1-modelos-mongoose)
2. [Repositories](#2-repositories)
3. [Services](#3-services)
4. [Controllers](#4-controllers)
5. [Middlewares](#5-middlewares)
6. [Validators (Zod)](#6-validators-zod)
7. [Utils](#7-utils)
8. [Config](#8-config)
9. [Endpoints montados actualmente](#9-endpoints-montados-actualmente)
10. [Dependencias clave y versiones](#10-dependencias-clave-y-versiones)
11. [Deuda técnica / inconsistencias detectadas](#11-deuda-técnica--inconsistencias-detectadas)

---

## 1. Modelos (Mongoose)

Todos los modelos usan sintaxis ESM (`import`/`export default`) — obligatorio por `"type": "module"` en `package.json`.

### `user.model.js` → `Usuario` (colección real: `usuarios`)

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | String, requerido | `trim` |
| `email` | String, requerido, único | `lowercase`, `trim` |
| `contraseñaHash` | String, requerido | `select: false` — nunca se trae en un `find()` normal, hay que pedirlo con `.select('+contraseñaHash')` |
| `rol` | enum `aprendiz` \| `mentor` \| `administrador` | default `aprendiz` |
| `perfilMentor` | subdocumento `{ bio, especialidad, verificado }` | `default: undefined` → los aprendices no cargan este subdocumento en absoluto (no es que quede vacío, es que no existe) |
| `activo` | Boolean | default `true`. Borrado lógico: `login()` en `auth.service.js` solo permite `activo: true` |
| `createdAt` / `updatedAt` | Date | automáticos (`timestamps: true`) |

Sin métodos de instancia/estáticos custom — es un modelo "plano", toda la lógica vive en `auth.service.js`.

### `course.model.js` → `Curso` (colección real: `cursos`)

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | String, requerido | máx 120 |
| `descripcion` | String, requerido | máx 2000 |
| `categoria` | String, requerido | |
| `mentor` | ObjectId → ref `Usuario`, requerido | |
| `portadaUrl` | String \| null | default `null` |
| `estado` | enum `borrador` \| `publicado` \| `archivado` | default `borrador` |
| `precio` | Number | default `0`, `min: 0` |
| `duracionEstimadaHoras` | Number | default `0`, `min: 0` |
| `bot.entrenado` | Boolean | default `false` — se marca `true` cuando termine el pipeline RAG |
| `bot.fechaEntrenamiento` | Date \| null | |
| `bot.documentoOrigenNombre` | String \| null | |
| `bot.totalChunks` | Number | default `0` |
| `activo` | Boolean | default `true`. Borrado lógico (ver `eliminarLogico` en el repository) |

Índices: `{ mentor: 1 }`, `{ estado: 1 }`.

### `enrollment.model.js` → `Enrollment` (colección real: `enrollments`)

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | ObjectId → ref `Usuario`, requerido | |
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `estado` | enum `activo` \| `completado` \| `suspendido` | default `activo` |
| `progreso` | Number | default `0`, porcentaje 0-100 (sin validación de rango en el schema todavía) |

Índice compuesto único `{ userId: 1, courseId: 1 }` — un usuario no puede inscribirse dos veces al mismo curso.

**Estado de integración:** modelo definido, pero todavía sin repository/service/controller/route propios. No se usa desde ningún endpoint activo.

### `liveSession.model.js` → `LiveSession` (colección real: `livesessions`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `mentorId` | ObjectId → ref `Usuario`, requerido | |
| `titulo` | String, requerido | |
| `estado` | enum `programada` \| `en_curso` \| `finalizada` \| `cancelada` | default `programada` |
| `fechaInicioProgramada` | Date, requerido | |
| `fechaInicioReal` | Date | |
| `fechaFin` | Date | |
| `urlReunion` | String | |
| `transcript` | String | opcional, si se logra grabar/transcribir la sesión |
| `asistentes` | [ObjectId → ref `Usuario`] | |

**Estado de integración:** solo el modelo existe. Sin repository/service/controller/route ni sockets todavía (`src/sockets/` está vacío).

### `chatMessage.model.js` → `ChatMessage` (colección real: `chatmessages`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `threadId` | String, indexado | agrupa una conversación con el bot |
| `liveSessionId` | ObjectId → ref `LiveSession` | null si es chat directo con el bot fuera de una sesión en vivo |
| `remitenteId` | ObjectId → ref `Usuario` | null si el remitente es el bot |
| `rolRemitente` | enum `aprendiz` \| `mentor` \| `bot`, requerido | |
| `contenido` | String, requerido | |
| `esRespuestaBot` | Boolean | default `false` |

**Estado de integración:** solo el modelo existe, sin capa de servicio todavía.

### `document.model.js` → `Document` (colección real: `documents`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `mentorId` | ObjectId → ref `Usuario`, requerido | |
| `nombreOriginal` | String, requerido | |
| `fileUrl` | String, requerido | |
| `tipo` | enum `pdf` \| `txt` \| `enlace` | default `pdf` |
| `estado` | enum `pendiente` \| `procesando` \| `completado` \| `error` | default `pendiente` — refleja el avance del job de chunking/embeddings |
| `errorMessage` | String | motivo del fallo si el job de procesamiento falla |

**Estado de integración:** ✅ **IMPLEMENTADO** — Tiene repository (`document.repository.js`), service (`document.service.js`), controller (`document.controller.js`) y routes (`document.routes.js`). El flujo completo de subida de PDF, extracción de texto, chunking y generación de embeddings está funcional.

### `knowledgeChunk.model.js` → `KnowledgeChunk` (colección real: `knowledgechunks`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | filtro obligatorio en toda query RAG (ver `03_BACKEND_GUIDELINES.md`) |
| `documentId` | ObjectId → ref `Document`, requerido | |
| `texto` | String, requerido | fragmento del documento original |
| `embedding` | [Number], requerido | vector de 384 dimensiones con `Xenova/all-MiniLM-L6-v2` |
| `metadata.pagina` | Number | |
| `metadata.seccion` | String | |

El índice de Vector Search sobre `embedding` se crea manualmente en MongoDB Atlas, no vía Mongoose (ver `04_DATABASE_SCHEMA.md`).

**Estado de integración:** ✅ **IMPLEMENTADO** — Tiene repository (`knowledgeChunk.repository.js`). Los chunks se generan automáticamente cuando un mentor sube un PDF vía `POST /api/cursos/:cursoId/documentos`. El service `embedding.service.js` genera los vectores con `@xenova/transformers` (modelo `Xenova/all-MiniLM-L6-v2`).

---

## 2. Repositories

Capa que encapsula el acceso a Mongoose. Los services nunca deben importar un modelo directamente (regla de `03_BACKEND_GUIDELINES.md`).

### `auth.repository.js` → `AuthRepository` (exporta instancia única `new AuthRepository()`)

| Método | Firma | Qué hace |
|---|---|---|
| `buscarPorEmail` | `(email)` | `Usuario.findOne({ email })` — busca por email sin filtrar por `activo` |
| `buscarPorEmailConContraseña` | `(email)` | `Usuario.findOne({ email, activo: true }).select('+contraseñaHash')` — trae explícitamente el campo `contraseñaHash` que tiene `select: false` en el schema. Solo permite usuarios activos (respeta borrado lógico) |
| `crear` | `(datosUsuario)` | `new Usuario(datosUsuario).save()` — crea y guarda un nuevo usuario |

### `course.repository.js` → `CursoRepository` (exporta instancia única `new CursoRepository()`)

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosCurso)` | `Curso.create(datosCurso)` |
| `buscarPorId` | `(id)` | Busca por `_id` + `activo: true`, hace `populate('mentor', 'nombre email')` |
| `listarPublicados` | `({ pagina = 1, limite = 12 } = {})` | Filtra `estado: 'publicado', activo: true`, `populate('mentor', 'nombre')`, ordena por `createdAt` descendente, paginado con `skip`/`limit` |
| `listarPorMentor` | `(mentorId)` | Filtra `mentor: mentorId, activo: true`, ordena por `createdAt` descendente |
| `actualizar` | `(id, cambios)` | `findOneAndUpdate({ _id: id, activo: true }, cambios, { new: true, runValidators: true })` |
| `eliminarLogico` | `(id)` | `findOneAndUpdate({ _id: id }, { activo: false }, { new: true })` — no borra el documento, solo lo desactiva |
| `marcarBotEntrenado` | `(id, { totalChunks, documentoOrigenNombre })` | Actualiza `bot.entrenado`, `bot.fechaEntrenamiento`, `bot.totalChunks`, `bot.documentoOrigenNombre`. Pensado para que lo use el futuro pipeline RAG al terminar de generar embeddings — todavía no tiene ningún caller |

### `document.repository.js` → `DocumentRepository` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosDocumento)` | `Document.create(datosDocumento)` |
| `buscarPorId` | `(id)` | `Document.findById(id).populate('courseId', 'titulo')` |
| `listarPorCurso` | `(courseId)` | Filtra `{ courseId }`, ordena por `createdAt` descendente |
| `actualizarEstado` | `(id, { estado, errorMessage?, fileUrl? })` | `findByIdAndUpdate` con `{ new: true, runValidators: true }`. Actualiza `estado` y opcionalmente `errorMessage` y/o `fileUrl` |

### `knowledgeChunk.repository.js` → `KnowledgeChunkRepository` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `guardarLote` | `(chunks)` | `KnowledgeChunk.insertMany(chunks)` — guarda todos los chunks de un documento en una sola operación |
| `buscarPorDocumento` | `(documentId)` | `KnowledgeChunk.find({ documentId })` — devuelve todos los chunks de un documento específico |
| `eliminarPorDocumento` | `(documentId)` | `KnowledgeChunk.deleteMany({ documentId })` — borra todos los chunks de un documento (útil si se re-sube el PDF) |
| `buscarSimilares` | `(courseId, vectorPregunta, limite = 5)` | **Búsqueda vectorial** con MongoDB Atlas `$vectorSearch`: filtra por `courseId` (obligatorio), busca los `limite` chunks más similares al `vectorPregunta` usando índice `vector_index` (cosine similarity), `numCandidates = limite * 20`, devuelve `texto`, `metadata`, `documentId` y `score` |

### `chatMessage.repository.js` → `ChatMessageRepository` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosMensaje)` | `ChatMessage.create(datosMensaje)` — guarda un nuevo mensaje (pregunta del aprendiz o respuesta del bot) |
| `listarPorThread` | `(threadId)` | `ChatMessage.find({ threadId }).sort({ createdAt: 1 })` — devuelve todos los mensajes de un hilo ordenados cronológicamente |
| `listarPorCurso` | `(courseId, limite = 50)` | `ChatMessage.find({ courseId }).sort({ createdAt: -1 }).limit(limite)` — devuelve los últimos `limite` mensajes de un curso (para analítica/moderación) |

---

---

## 3. Services

Contienen la lógica de negocio. Reciben datos ya validados por los validators.

### `auth.service.js` → `AuthService` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `hashearContraseña` *(función privada del módulo, no del objeto)* | `(contraseña)` | `bcrypt.genSalt(10)` + `bcrypt.hash` |
| `generarToken` *(función privada)* | `(usuario)` | Firma un JWT con payload `{ id, rol, email }`, `expiresIn` = `process.env.JWT_EXPIRES_IN` o `'7d'` |
| `serializarUsuario` *(función privada)* | `(usuarioDoc)` | Convierte el doc de Mongoose a objeto plano y borra `contraseñaHash` y `__v` antes de devolverlo al cliente |
| `registrar` | `(datos)` | Verifica que el email no exista (`409` si ya existe), hashea la contraseña, crea el usuario (con `perfilMentor` solo si `rol === 'mentor'`), devuelve el usuario serializado (sin hash) |
| `iniciarSesion` | `(credenciales)` | Busca el usuario por `email` + `activo: true` trayendo explícitamente `contraseñaHash` (por el `select:false` del schema), compara con `bcrypt.compare`. Mismo mensaje de error (`401`) tanto si el usuario no existe como si la contraseña es incorrecta, para no filtrar qué correos están registrados. Devuelve `{ token, usuario }` |

### `course.service.js` → `CursoService` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `crearCurso` | `(mentorId, datosCurso)` | Delega a `cursoRepository.crear`, inyectando `mentor: mentorId` |
| `obtenerCursoPorId` | `(id)` | Delega a `cursoRepository.buscarPorId`; lanza `AppError('Curso no encontrado', 404)` si no existe |
| `listarCursosPublicados` | `(opcionesPaginacion)` | Delega a `cursoRepository.listarPublicados` |
| `listarCursosDeMentor` | `(mentorId)` | Delega a `cursoRepository.listarPorMentor` |
| `actualizarCurso` | `(id, mentorId, cambios)` | Obtiene el curso, verifica propiedad (`verificarPropiedad`), delega a `cursoRepository.actualizar` |
| `cambiarEstado` | `(id, mentorId, estado)` | Igual que `actualizarCurso` pero solo cambia el campo `estado` |
| `eliminarCurso` | `(id, mentorId)` | Verifica propiedad, delega a `cursoRepository.eliminarLogico` (soft delete) |
| `verificarPropiedad` | `(curso, mentorId)` | Compara `curso.mentor` (o `curso.mentor._id` si viene populado) contra `mentorId`; lanza `AppError('No tienes permiso sobre este curso', 403)` si no coincide. El rol `administrador` como bypass de esta regla NO está implementado — ver sección 11 |

### `document.service.js` → `DocumentService` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `subirDocumento` | `(mentorId, cursoId, archivo)` | 1. Verifica que el curso exista y pertenezca al mentor. 2. Crea un registro `Document` en estado `pendiente`. 3. Sube el buffer del PDF a Cloudinary (carpeta `mentorsync/documentos`). 4. Extrae el texto con `pdf-parse`. 5. Fragmenta el texto con `textChunker.fragmentarTexto` (chunks de 1000 caracteres con overlap de 200). 6. Genera embeddings para cada chunk con `embeddingService.generarEmbedding`. 7. Guarda los chunks en lote con `knowledgeChunkRepository.guardarLote`. 8. Actualiza el documento a estado `completado` con la URL de Cloudinary. 9. Devuelve `{ documento, vistaPrevia: { totalPaginas, totalCaracteres, totalFragmentos, dimensionesEmbedding, fragmento } }`. Si algo falla, marca el documento como `error` y lanza `AppError(500)` |
| `listarDocumentosDeCurso` | `(cursoId, mentorId)` | Verifica propiedad del curso, delega a `documentRepository.listarPorCurso` |

### `embedding.service.js` → `EmbeddingService` (exporta instancia única, Singleton pattern)

| Método | Firma | Qué hace |
|---|---|---|
| `obtenerExtractor` | `()` | Inicializa el pipeline de `@xenova/transformers` con el modelo `Xenova/all-MiniLM-L6-v2` (descarga y cachea localmente la primera vez). Devuelve la instancia del extractor. Singleton pattern: solo inicializa una vez, aunque se llame múltiples veces |
| `generarEmbedding` | `(texto)` | Recibe un string, devuelve un `Array<number>` de 384 dimensiones (vector/embedding). Usa `pooling: 'mean'` y `normalize: true` |

### `rag.service.js` → `RagService` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `responderPregunta` | `(cursoId, pregunta)` | **Pipeline RAG completo**: 1. Valida que la pregunta tenga al menos 3 caracteres. 2. Verifica que el curso exista (`cursoService.obtenerCursoPorId`). 3. Embebe la pregunta con `embeddingService.generarEmbedding`. 4. Busca los 5 chunks más relevantes con `knowledgeChunkRepository.buscarSimilares` (filtrando solo ese `courseId`). 5. Si no hay chunks, devuelve mensaje de "curso sin material". 6. Arma prompt con contexto + pregunta + instrucciones. 7. Llama a `groqProvider.generarRespuesta`. 8. Devuelve `{ respuesta, fragmentosUsados }` (con `documentId`, `score` y vista previa de cada fragmento usado) |
| `armarPrompt` *(función privada)* | `(pregunta, chunks)` | Construye el array de mensajes para el modelo: mensaje `system` con instrucciones (responder solo con base en contexto, no inventar, markdown cuando ayude) + mensaje `user` con contexto del curso (chunks formateados como `[Fragmento N]`) + pregunta del aprendiz |

### `groq.provider.js` → `GroqProvider` (exporta instancia única, implementa `IAssistantProvider`)

| Método | Firma | Qué hace |
|---|---|---|
| `obtenerCliente` | `()` | Inicializa perezosamente el cliente de Groq con `process.env.GROQ_API_KEY`. Si la clave no está configurada, lanza `AppError(503, 'GROQ_NOT_CONFIGURED')`. Singleton: solo crea el cliente una vez |
| `generarRespuesta` | `(mensajes, opciones = {})` | Llama a `groq.chat.completions.create` con `model` (default `GROQ_MODEL` de `.env`), `messages`, `temperature` (default 0.3), `max_tokens` (default 1024). Devuelve el `content` del primer `choice`. Si la respuesta está vacía, lanza `AppError(502, 'GROQ_EMPTY_RESPONSE')`. Si falla la request, lanza `AppError(502, 'GROQ_REQUEST_FAILED')` |

### `chat.service.js` → `ChatService` (exporta instancia única)

| Método | Firma | Qué hace |
|---|---|---|
| `enviarPregunta` | `(cursoId, aprendizId, pregunta, threadId?)` | 1. Verifica que el curso exista y esté publicado (`estado: 'publicado'`), lanza `AppError(403, 'COURSE_NOT_PUBLISHED')` si no lo está. 2. Si no viene `threadId`, genera uno nuevo con `randomUUID()` (UUID v4). 3. Guarda la pregunta del aprendiz en `chatmessages`. 4. Llama a `ragService.responderPregunta` para obtener respuesta + fragmentos. 5. Guarda la respuesta del bot en `chatmessages` (con `remitenteId: null`, `rolRemitente: 'bot'`, `esRespuestaBot: true`). 6. Devuelve `{ threadId, respuesta, mensajeId, fragmentosUsados }` |
| `obtenerHistorial` | `(threadId)` | Delega a `chatMessageRepository.listarPorThread` — devuelve todos los mensajes del hilo ordenados por fecha |

---

## 4. Controllers

Solo deben recibir/responder HTTP y delegar al service (regla de `03_BACKEND_GUIDELINES.md`).

### `auth.controller.js` → `AuthController` (exporta instancia única)

| Método | Ruta que lo usa | Qué hace |
|---|---|---|
| `registrar` | `POST /api/auth/registro` | Llama `authService.registrar(req.body)`, responde `201` con `{ success, message, data: { usuario } }` |
| `iniciarSesion` | `POST /api/auth/inicio-sesion` | Llama `authService.iniciarSesion(req.body)`, responde `200` con `{ success, message, data: { token, usuario } }` |

Ambos usan `try/catch` + `next(error)`.

### `course.controller.js` (funciones exportadas individualmente, no una clase)

| Función | Ruta que la usa | Qué hace |
|---|---|---|
| `crearCurso` | `POST /api/cursos` | `cursoService.crearCurso(req.usuario.id, req.body)` → `201` |
| `obtenerCurso` | `GET /api/cursos/:id` | `cursoService.obtenerCursoPorId(req.params.id)` → `200` |
| `listarCursosPublicados` | `GET /api/cursos` | Lee `pagina`/`limite` de `req.query` (default `1`/`12`), delega a `cursoService.listarCursosPublicados` → `200` |
| `listarMisCursos` | `GET /api/cursos/mis-cursos` | `cursoService.listarCursosDeMentor(req.usuario.id)` → `200` |
| `actualizarCurso` | `PATCH /api/cursos/:id` | `cursoService.actualizarCurso(req.params.id, req.usuario.id, req.body)` → `200` |
| `cambiarEstadoCurso` | `PATCH /api/cursos/:id/estado` | `cursoService.cambiarEstado(req.params.id, req.usuario.id, req.body.estado)` → `200` |
| `eliminarCurso` | `DELETE /api/cursos/:id` | `cursoService.eliminarCurso(req.params.id, req.usuario.id)` → `200` con mensaje de confirmación |

Todas usan `try/catch` + `next(error)`.

### `document.controller.js` (objeto exportado con métodos)

| Método | Ruta que lo usa | Qué hace |
|---|---|---|
| `subirDocumento` | `POST /api/cursos/:cursoId/documentos` | Lee el archivo de `req.file` (multer), llama `documentService.subirDocumento(req.usuario.id, req.params.cursoId, req.file)` → `201` con `{ success, message, data: { documento, vistaPrevia } }` |
| `listarDocumentos` | `GET /api/cursos/:cursoId/documentos` | `documentService.listarDocumentosDeCurso(req.params.cursoId, req.usuario.id)` → `200` con `{ success, message, data: { documentos } }` |
| `verChunks` | `GET /api/cursos/:cursoId/documentos/:documentoId/chunks` | `knowledgeChunkRepository.buscarPorDocumento(req.params.documentoId)` (sin capa de service por ahora) → `200` con `{ success, message, data: { total, chunks } }` |

### `chat.controller.js` → `ChatController` (exporta instancia única)

| Método | Ruta que lo usa | Qué hace |
|---|---|---|
| `enviarPregunta` | `POST /api/cursos/:cursoId/chat` | `chatService.enviarPregunta(req.params.cursoId, req.usuario.id, req.body.pregunta, req.body.threadId)` → `200` con `{ success, message, data: { threadId, respuesta, mensajeId, fragmentosUsados } }` |
| `obtenerHistorial` | `GET /api/cursos/chat/historial/:threadId` | `chatService.obtenerHistorial(req.params.threadId)` → `200` con `{ success, message, data: { mensajes } }` |

> Nota de formato de respuesta: `course.controller.js` responde con `{ exito, curso }` / `{ exito, cursos }`, mientras `auth.controller.js`, `document.controller.js` y `chat.controller.js` usan `{ success, data, message }`. Ver sección 11.

---

## 5. Middlewares

### `auth.middleware.js` → `verificarToken` (named export)

Lee el header `Authorization`, exige el prefijo `Bearer `. Si falta o el formato es inválido → `AppError(401)`. Si el token no verifica con `jwt.verify` (usando `JWT_SECRET`) → `AppError(403)`. Si es válido, adjunta el payload decodificado (`{ id, rol, email, iat, exp }`) en `req.usuario` y llama `next()`.

### `role.middleware.js` → `verificarRol(...rolesPermitidos)` (named export, factory)

Debe usarse siempre **después** de `verificarToken`. Si `req.usuario.rol` no existe → `AppError(401)`. Si el rol no está en `rolesPermitidos` → `AppError(403)`. Uso: `verificarRol('mentor', 'administrador')`.

### `validar.middleware.js` → `validar(esquema)` (named export, factory)

Corre `esquema.safeParse(req.body)` (esquema Zod). Si falla, junta los mensajes de `resultado.error.issues` (Zod v4; ver sección 10) separados por coma y los envuelve en `AppError(400)`. Si pasa, **reemplaza** `req.body` con `resultado.data` (los datos ya limpios/tipados que devuelve Zod, p. ej. el email ya en minúsculas).

### `error.middleware.js` → `manejarErrores` (named export)

Middleware de 4 argumentos, montado al final de `server.js`. Lee `error.statusCode || 500`. Si `req.log` existe (inyectado por `pino-http`), loguea el error ahí; si no, usa `console.error`. Responde `{ success: false, error: { message } }` — si el status es `500`, oculta el mensaje real y devuelve `"Error interno del servidor"` (para no filtrar detalles internos al cliente).

---

## 6. Validators (Zod)

> El proyecto usa **Zod v4** (`"zod": "^4.4.3"`), no v3. Ver diferencias de API en la sección 10.

### `auth.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaRegistro` | `nombre` (string, 2–100), `email` (string, email, lowercase, trim), `contraseña` (string, 8–72 — 72 por el límite de bytes de bcrypt), `rol` (enum opcional `aprendiz`\|`mentor`\|`administrador`), `perfilMentor` (objeto opcional `{ bio?, especialidad? }`) |
| `esquemaInicioSesion` | `email` (string, email, lowercase, trim), `contraseña` (string, mínimo 1 carácter — solo valida que no esté vacía, no repite las reglas de longitud del registro) |

### `course.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaCrearCurso` | `titulo` (string, 3–120), `descripcion` (string, 10–2000), `categoria` (string, 2–60), `precio` (number ≥ 0, opcional), `duracionEstimadaHoras` (number ≥ 0, opcional) |
| `esquemaActualizarCurso` | `esquemaCrearCurso.partial()` — mismos campos, todos opcionales (para `PATCH`) |
| `esquemaCambiarEstado` | `estado` (enum `borrador`\|`publicado`\|`archivado`, con mensaje de error custom vía `error`, no `errorMap` — ver sección 10) |

### `chat.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaPregunta` | `pregunta` (string, trim, 3–1000 caracteres), `threadId` (string, UUID v4, opcional) |

---

## 7. Utils

### `AppError.js` → `AppError` (named export, clase)

Extiende `Error`. Constructor `(message, statusCode = 500)`. Agrega `this.statusCode`, fija `this.name` al nombre de la clase y llama `Error.captureStackTrace`. Es la única forma permitida de lanzar errores desde un service (regla de `03_BACKEND_GUIDELINES.md`).

### `textChunker.js` → `fragmentarTexto` (named export, función)

| Firma | Qué hace |
|---|---|
| `fragmentarTexto(texto, chunkSize = 1000, overlap = 200)` | Fragmenta un texto largo en chunks para embeddings. 1. Limpia espacios extra y saltos de línea (`\s+` → espacio simple). 2. Itera avanzando `chunkSize - overlap` caracteres en cada paso (esto hace que los chunks se "crucen" — el final de un chunk aparece también al inicio del siguiente, para preservar contexto). 3. Devuelve un array de strings. Si `texto` es vacío/null, devuelve `[]` |

### `assistant-provider.interface.js` → `IAssistantProvider` (clase abstracta, named export)

Interfaz del **Strategy Pattern** para proveedores de IA. Cualquier proveedor nuevo (OpenAI, Anthropic, otro modelo open-weight) debe extender esta clase e implementar `generarRespuesta()`. `rag.service.js` solo conoce esta interfaz, nunca el SDK concreto — así se puede cambiar de proveedor sin tocar la lógica de negocio del RAG.

| Método abstracto | Firma | Qué debe hacer la subclase |
|---|---|---|
| `generarRespuesta` | `(mensajes, opciones = {})` | Recibe array de mensajes (formato `[{role, content}]`), opciones (modelo, temperatura, maxTokens). Devuelve `Promise<string>` con el texto de la respuesta generada. Lanza error si falla |

**Implementaciones actuales:**
- ✅ `groq.provider.js` — usa SDK de Groq con modelos open-weight (Llama, Mixtral, etc.)

---

## 8. Config

### `database.js` → `conectarBaseDatos` (named export, async)

Lee `MONGODB_URI` de `process.env`; si falta, lanza `Error` nativo (no `AppError`, porque corre antes de que exista cualquier request HTTP). Registra listeners de `mongoose.connection` para `connected`/`error`/`disconnected` con `console.log`/`console.error`/`console.warn`. Llama `mongoose.connect(uri)`. Se invoca una sola vez desde `server.js`, antes de `app.listen`, para que ninguna request llegue a un controller antes de tener conexión a la base.

### `cloudinary.js` → configuración de Cloudinary (default export)

Configura el SDK de Cloudinary v2 con las credenciales de `.env`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Exporta la instancia configurada (`cloudinary`) para usarla en `document.service.js` (subida de PDFs a la carpeta `mentorsync/documentos` con `resource_type: 'raw'`).

---

## 9. Endpoints montados actualmente

Base URL local: `http://localhost:4000`

### `/api/auth` (público salvo donde se indica)

| Método | Ruta | Middleware | Body / Query |
|---|---|---|---|
| `POST` | `/api/auth/registro` | `validar(esquemaRegistro)` | `{ nombre, email, contraseña, rol?, perfilMentor? }` |
| `POST` | `/api/auth/inicio-sesion` | `validar(esquemaInicioSesion)` | `{ email, contraseña }` |
| `GET` | `/api/auth/perfil-protegido` | `verificarToken` + `verificarRol('aprendiz','mentor','administrador')` | — (ruta de prueba, devuelve el payload del JWT) |

### `/api/cursos`

| Método | Ruta | Middleware | Notas |
|---|---|---|---|
| `GET` | `/api/cursos` | — (público) | Query `pagina`, `limite`. Solo `estado: 'publicado'` |
| `GET` | `/api/cursos/mis-cursos` | `verificarToken` + `verificarRol('mentor')` | Definida antes de `/:id` para que Express no la confunda con un id |
| `GET` | `/api/cursos/:id` | — (público) | |
| `POST` | `/api/cursos` | `verificarToken` + `verificarRol('mentor')` + `validar(esquemaCrearCurso)` | |
| `PATCH` | `/api/cursos/:id` | `verificarToken` + `verificarRol('mentor')` + `validar(esquemaActualizarCurso)` | El service valida que el curso pertenezca al mentor autenticado |
| `PATCH` | `/api/cursos/:id/estado` | `verificarToken` + `verificarRol('mentor')` + `validar(esquemaCambiarEstado)` | |
| `DELETE` | `/api/cursos/:id` | `verificarToken` + `verificarRol('mentor')` | Soft delete (`activo: false`) |
| `POST` | `/api/cursos/:cursoId/documentos` | `verificarToken` + `verificarRol('mentor')` + `multer.single('archivo')` | Sube un PDF (máx 15 MB), lo procesa (extracción de texto, chunking, embeddings) y lo almacena en Cloudinary. Body es `multipart/form-data` con el campo `archivo` |
| `GET` | `/api/cursos/:cursoId/documentos` | `verificarToken` + `verificarRol('mentor')` | Lista los documentos de un curso |
| `GET` | `/api/cursos/:cursoId/documentos/:documentoId/chunks` | `verificarToken` + `verificarRol('mentor')` | Devuelve los chunks (fragmentos + embeddings) generados para un documento específico — útil para debugging del pipeline RAG |

### `/api/cursos` (continuación)

| Método | Ruta | Middleware | Notas |
|---|---|---|---|
| `POST` | `/api/cursos/:cursoId/chat` | `verificarToken` + `verificarRol('aprendiz','mentor','administrador')` + `validar(esquemaPregunta)` | Envía pregunta al bot del curso. Body: `{ pregunta, threadId? }`. Devuelve `{ success, data: { threadId, respuesta, mensajeId, fragmentosUsados } }`. Solo funciona si el curso está publicado (`estado: 'publicado'`) |
| `GET` | `/api/cursos/chat/historial/:threadId` | `verificarToken` | Obtiene historial completo de un hilo de conversación (todos los mensajes ordenados cronológicamente) |

Verificado manualmente el 2026-08-31 (auth y cursos básico). Verificado el 2026-09-01 (documentos y chat con Bruno API). **Estado: ✅ Todos los endpoints principales verificados.**

---

## 10. Dependencias clave y versiones

Extraídas de `backend/package.json` (verificar este archivo para la lista completa).

| Dependencia | Versión | Qué hace en el proyecto |
|---|---|---|
| `@xenova/transformers` | `^2.17.2` | Genera embeddings localmente (modelo `Xenova/all-MiniLM-L6-v2`, 384 dimensiones). No necesita GPU ni API externa — corre en CPU puro. La primera ejecución descarga el modelo (~30MB) y lo cachea. |
| `bcryptjs` | `^3.0.3` | Hash de contraseñas con salt de 10 rondas (ver `auth.service.js`) |
| `cloudinary` | `^2.11.0` | Subida de PDFs a almacenamiento en la nube (carpeta `mentorsync/documentos`). Requiere variables de entorno `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `compression` | `^1.8.1` | Compresión gzip de respuestas HTTP |
| `cors` | `^2.8.6` | Habilita CORS (montado globalmente, acepta cualquier origen por ahora) |
| `dotenv` | `^16.4.7` | Carga variables de entorno desde `.env` |
| `express` | `^4.21.2` | Framework web |
| `express-mongo-sanitize` | `^2.2.0` | Previene NoSQL injection limpiando `req.body`, `req.query` y `req.params` |
| `express-rate-limit` | `^8.6.2` | Rate limiting global: 300 requests por IP cada 15 minutos (ver `server.js`) |
| `groq-sdk` | `^0.15.0` | Cliente oficial de Groq para chat completions. **Ahora en uso activo** — implementado en `groq.provider.js` para el chatbot RAG. Requiere `GROQ_API_KEY` y `GROQ_MODEL` (modelo por defecto, ej. `llama-3.3-70b-versatile`) |
| `helmet` | `^8.3.0` | Headers de seguridad HTTP |
| `jsonwebtoken` | `^9.0.3` | Generación y verificación de JWT (payload `{id, rol, email}`, expiración configurable vía `JWT_EXPIRES_IN`) |
| `mongodb` | `^7.6.0` | Driver nativo de MongoDB (Mongoose lo usa internamente) |
| `mongoose` | `^8.9.5` | ODM para MongoDB |
| `multer` | `^1.4.5-lts.2` | Middleware para `multipart/form-data` (subida de archivos). Configurado con límite de 15 MB y filtro para solo PDFs en `document.routes.js` |
| `pdf-parse` | `^1.1.1` | Extracción de texto plano desde buffer de PDF |
| `pino` + `pino-http` | `^10.3.1` / `^11.0.0` | Logging estructurado JSON (requiere `pino-pretty` en dev para formato legible) |
| `socket.io` | `^4.8.3` | **Instalado pero aún no usado** — futuro soporte para chat en vivo mentor↔aprendiz |
| `streamifier` | `^0.1.1` | Convierte buffer de PDF a stream para subirlo a Cloudinary |
| `swagger-jsdoc` + `swagger-ui-express` | `^6.3.0` / `^5.0.1` | **Instalados pero aún no montados** (ver `// TODO` en `server.js`) |
| `zod` | `^4.4.3` | Validación de schemas. ⚠️ **Es Zod v4**, no v3 — API cambió (`error.issues` en vez de `error.errors`, opción `error` en vez de `errorMap` para enums). Ver correcciones en la revisión del 2026-08-31 |

### Variables de entorno esperadas (`.env`)

Definidas en `.env.example`:
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
```

**Actualización 2026-09-01:** `GROQ_API_KEY` y `GROQ_MODEL` ahora sí son necesarias para que el chatbot funcione. El servidor puede arrancar sin ellas (inicialización perezosa en `groq.provider.js`), pero cualquier llamada al bot lanzará `AppError(503, 'GROQ_NOT_CONFIGURED')` si falta `GROQ_API_KEY`.

Antes de levantar el servidor, correr `npm run check-setup` (`scripts/check-setup.js`) para validar que todas las variables críticas estén presentes. **El script actual solo valida `PORT`, `MONGODB_URI`, `JWT_SECRET` y `GROQ_API_KEY`** — falta agregar las de Cloudinary y `GROQ_MODEL`.

---

## 11. Deuda técnica / inconsistencias detectadas

Encontradas en la revisión de código del 2026-08-31. Las marcadas ✅ ya se corrigieron; el resto sigue pendiente.

- ✅ **Corregido** — `course.service.js` importaba `AppError` como default export (`import AppError from '../utils/AppError.js'`), pero `AppError.js` solo tiene named export. Esto rompía la carga de todo el módulo (y por lo tanto de `server.js` completo, porque `server.js` importa `course.routes.js` → `course.controller.js` → `course.service.js`).
- ✅ **Corregido** — `course.routes.js` importaba `verificarToken`, `verificarRol` y `validar` como default exports; los tres middlewares solo tienen named export. Mismo efecto: rompía el arranque del servidor.
- ✅ **Corregido** — `enrollment.model.js`, `liveSession.model.js`, `chatMessage.model.js`, `document.model.js` y `knowledgeChunk.model.js` usaban sintaxis CommonJS (`require`/`module.exports`) en un proyecto `"type": "module"`. Convertidos a `import`/`export default`.
- ✅ **Corregido** — esos mismos modelos referenciaban `ref: 'User'` / `ref: 'Course'`, pero los modelos reales están registrados como `'Usuario'` y `'Curso'` (ver `user.model.js`/`course.model.js`). Cualquier `.populate()` sobre esos campos fallaría en silencio (Mongoose no lanza error si el modelo referenciado no existe, simplemente no puede resolver la referencia). Ajustados a `'Usuario'`/`'Curso'`.
- ✅ **Corregido** — `validar.middleware.js` usaba `resultado.error.errors` (API de Zod v3). El proyecto tiene instalado **Zod v4**, donde la propiedad se renombró a `resultado.error.issues`. Con `errors` undefined, cualquier validación fallida producía un `500` (`TypeError: Cannot read properties of undefined (reading 'map')`) en lugar de un `400` con el mensaje real. Esto se reprodujo en pruebas manuales antes de corregirlo.
- ✅ **Corregido** — `course.validator.js` usaba la opción `errorMap` de `z.enum(...)` (API de Zod v3). En Zod v4 la opción correcta es `error`; con `errorMap` no se lanza excepción, pero el mensaje custom se ignora silenciosamente y Zod devuelve su mensaje default. Cambiado a `error: () => 'Estado inválido'`.

**Pendiente (no bloquea funcionalidad actual, pero está fuera de convención o incompleto):**

- ✅ **Corregido** — `auth.repository.js` ahora existe y `auth.service.js` lo usa correctamente. Ya no consulta el modelo `Usuario` directamente.
- [ ] Inconsistencia de formato de respuesta entre módulos: `auth.controller.js` y `document.controller.js` responden `{ success, message, data }` (formato documentado en `03_BACKEND_GUIDELINES.md`), pero `course.controller.js` responde `{ exito, curso }` / `{ exito, cursos }` — dos convenciones distintas (español/inglés, y sin envolver en `data`). Conviene unificar antes de que el frontend empiece a consumir ambos endpoints.
- [ ] `04_DATABASE_SCHEMA.md` describe el diseño de colecciones con nombres de campo en inglés (`passwordHash`, `mentorId`, `estado: "activo"|"borrador"`) que ya no coinciden con la implementación real en español (`contraseñaHash`, `mentor`, `estado: "borrador"|"publicado"|"archivado"`, más `precio`, `duracionEstimadaHoras`, `bot.*`, `activo`). Ver la actualización aplicada a ese documento.
- [ ] Ningún endpoint tiene todavía su bloque `@openapi` para swagger-jsdoc, pese a que la regla en `03_BACKEND_GUIDELINES.md` dice "no dejar endpoints nuevos sin su bloque `@openapi`". `swagger-ui-express` tampoco está montado en `server.js` (hay un `// TODO` explícito).
- [ ] `enrollment.model.js`, `liveSession.model.js`, `chatMessage.model.js`, `document.model.js` y `knowledgeChunk.model.js` no tienen todavía repository/service/controller/routes — solo el modelo Mongoose existe.
- [ ] `verificarPropiedad` en `course.service.js` no contempla el rol `administrador` como bypass (un admin no podría editar/eliminar el curso de un mentor aunque el middleware de rol lo dejara pasar a la ruta, porque hoy esas rutas solo aceptan `verificarRol('mentor')`).
- [ ] `esquemaInicioSesion.contraseña` solo exige `min(1)` — no repite el rango 8–72 de `esquemaRegistro`. Es intencional (no se debe validar la política de contraseña en el login, solo que no venga vacía), pero vale dejarlo explícito para que no se lea como un descuido.
- [ ] `enrollment.model.js` no valida rango (`min`/`max`) en `progreso`, a diferencia de otros campos numéricos del proyecto que sí usan `min: 0`.

---

*Última revisión de código: 2026-08-31. Actualizar este documento cada vez que se agregue un método, modelo, middleware o validator nuevo.*


**Pendiente — agregadas tras implementar módulo de documentos (2026-09-01):**

- [ ] `README.md` menciona "Google Gemini API" en el stack cuando en realidad el proyecto usa Groq (SDK instalado, pendiente de implementar el chatbot). También dice que el RAG está en desarrollo, pero el chunking+embeddings ya funciona completamente — solo falta la búsqueda vectorial con `$vectorSearch` + generación de respuestas con LLM.
- [ ] `scripts/check-setup.js` valida `GROQ_API_KEY` pero esa variable ya no aparece en `.env.example`. Además, no valida las 3 variables de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), que sí son obligatorias ahora que el módulo de documentos está activo.
- [ ] `document.controller.verChunks` llama directamente a `knowledgeChunkRepository` sin pasar por un service — rompe la convención de `03_BACKEND_GUIDELINES.md` ("El Controller nunca debe importar un repository directamente"). Probablemente convenga mover esa query a `document.service.js`.
- [ ] Los endpoints de documentos (`POST /api/cursos/:cursoId/documentos`, `GET /api/cursos/:cursoId/documentos`, `GET /api/cursos/:cursoId/documentos/:documentoId/chunks`) no tienen validación manual end-to-end documentada (los otros endpoints se verificaron el 2026-08-31 con curl/PowerShell).

---

*Última revisión de código: 2026-09-01 (actualización tras implementación del módulo de documentos + pipeline completo de chunking y embeddings). Actualizar este documento cada vez que se agregue un método, modelo, middleware o validator nuevo.*
