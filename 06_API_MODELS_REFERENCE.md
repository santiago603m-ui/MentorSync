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
| `contraseñaHash` | String, requerido | `select: false` — hay que pedirlo con `.select('+contraseñaHash')` |
| `rol` | enum `aprendiz` \| `mentor` \| `administrador` | default `aprendiz` |
| `perfilMentor` | subdocumento `{ bio, especialidad, verificado }` | `default: undefined` → no existe en aprendices |
| `activo` | Boolean | default `true`. Borrado lógico (login y `user.repository` respetan) |
| `createdAt` / `updatedAt` | Date | automáticos (`timestamps: true`) |

### `course.model.js` → `Curso` (colección real: `cursos`)

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | String, requerido | máx 120, `trim` |
| `descripcion` | String, requerido | máx 2000, `trim` |
| `categoria` | String, requerido | `trim` |
| `mentor` | ObjectId → ref `Usuario`, requerido | |
| `portadaUrl` | String \| null | default `null` |
| `estado` | enum `borrador` \| `publicado` \| `archivado` | default `publicado` |
| `precio` | Number | default `0`, `min: 0` |
| `duracionEstimadaHoras` | Number | default `0`, `min: 0` |
| `contenidoTextoPlano` | String \| null | texto extraído del PDF para generar estructura con Groq |
| `modulos` | [moduloSchema] | ver subesquemas abajo |
| `bot.entrenado` | Boolean | default `false` |
| `bot.fechaEntrenamiento` | Date \| null | |
| `bot.documentoOrigenNombre` | String \| null | |
| `bot.totalChunks` | Number | default `0` |
| `activo` | Boolean | default `true`. Borrado lógico |
| `inscritos` | [inscritoSchema] | embebido con `_id` propio (ver abajo) |

Subesquemas:
- `moduloSchema: { titulo: String requerido, descripcion: String, orden: Number, lecciones: [leccionSchema] }`
- `leccionSchema: { titulo: String requerido, contenido: String requerido, puntosClave: [String], orden: Number }`
- `inscritoSchema: { id: ObjectId→Usuario requerido, nombre: String, correo: String }` con `{_id:true}` — se manipula con `$addToSet` / `$pull:{_id}`

Índices: `{ mentor: 1 }`, `{ estado: 1 }`.

### `enrollment.model.js` → `Enrollment` (colección real: `enrollments`)

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | ObjectId → ref `Usuario`, requerido | |
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `estado` | enum `activo` \| `completado` \| `suspendido` | default `activo` |
| `progreso` | Number | default `0`, sin validación de rango |

Índice único `{ userId: 1, courseId: 1 }` — hoy no se usa (inscripciones van embebidas en `cursos.inscritos`).

**Estado:** solo modelo, sin repository/service/controller.

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
| `transcript` | String | |
| `asistentes` | [ObjectId → ref `Usuario`] | |

**Estado:** solo modelo.

### `chatMessage.model.js` → `ChatMessage` (colección real: `chatmessages`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `threadId` | String, indexado | agrupa conversación |
| `liveSessionId` | ObjectId → ref `LiveSession` | null fuera de sesión |
| `remitenteId` | ObjectId → ref `Usuario` | null si es bot |
| `rolRemitente` | enum `aprendiz` \| `mentor` \| `bot`, requerido | |
| `contenido` | String, requerido | |
| `esRespuestaBot` | Boolean | default `false` |

**Estado:** ✅ Tiene repository (`chatMessage.repository.js`) + service (`chat.service.js`) + controller + routes.

### `document.model.js` → `Document` (colección real: `documents`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | |
| `mentorId` | ObjectId → ref `Usuario`, requerido | |
| `nombreOriginal` | String, requerido | |
| `fileUrl` | String, requerido | |
| `tipo` | enum `pdf` \| `txt` \| `enlace` | default `pdf` |
| `estado` | enum `pendiente` \| `procesando` \| `completado` \| `error` | |
| `errorMessage` | String | |

**Estado:** ✅ Tiene repository + service + controller + routes.

### `knowledgeChunk.model.js` → `KnowledgeChunk` (colección real: `knowledgechunks`)

| Campo | Tipo | Notas |
|---|---|---|
| `courseId` | ObjectId → ref `Curso`, requerido | filtro obligatorio en RAG |
| `documentId` | ObjectId → ref `Document`, requerido | |
| `texto` | String, requerido | fragmento |
| `embedding` | [Number], requerido | 384D `Xenova/all-MiniLM-L6-v2` |
| `metadata.pagina` | Number | |
| `metadata.seccion` | String | |

Índice Vector Search sobre `embedding` (ver `04_DATABASE_SCHEMA.md`).

**Estado:** ✅ Tiene repository (`knowledgeChunk.repository.js`) + `embedding.service.js`.

---

## 2. Repositories

Capa que encapsula Mongoose. Los services nunca importan modelos directos.

### `auth.repository.js` → `AuthRepository` (singleton)

| Método | Firma | Qué hace |
|---|---|---|
| `buscarPorEmail` | `(email)` | `Usuario.findOne({ email })` |
| `buscarPorEmailConContraseña` | `(email)` | `findOne({ email, activo:true }).select('+contraseñaHash')` |
| `crear` | `(datosUsuario)` | `new Usuario(datosUsuario).save()` |

### `user.repository.js` → `UsuarioRepository` (singleton) — **nuevo módulo admin**

| Método | Firma | Qué hace |
|---|---|---|
| `listar` | `({ rol, busqueda, pagina, limite, soloActivos })` | Construye `filtros` (`rol`, `activo`, `$or` regex `nombre`/`email`), `Promise.all([find().select('-contraseñaHash -__v').sort(createdAt:-1).skip().limit().lean(), countDocuments])` → `{usuarios, total, pagina, limite}` |
| `contarPorRol` | `()` | `aggregate([{ $group:{_id:'$rol', total:{$sum:1}} }])` → `{administrador, mentor, aprendiz, total}` |
| `buscarPorId` | `(id)` | `findById(id).select('-contraseñaHash -__v')` |
| `actualizar` | `(id, cambios)` | `findByIdAndUpdate(id, cambios, {new:true, runValidators:true}).select(...)` |
| `fechasRegistro` | `()` | `find({}, {createdAt:1}).lean()` (para graficar crecimiento) |

### `course.repository.js` → `CursoRepository` (singleton)

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosCurso)` | `Curso.create(datosCurso)` |
| `buscarPorId` | `(id)` | `findOne({_id:id, activo:true}).populate('mentor','nombre email')` |
| `listarPublicados` | `({ pagina, limite })` | `find({estado:'publicado', activo:true}).populate('mentor','nombre').sort(createdAt:-1).skip().limit()` |
| `listarPorMentor` | `(mentorId)` | `find({mentor:mentorId, activo:true}).sort(createdAt:-1)` |
| `listarTodos` | `()` | `find({activo:true}).populate('mentor','nombre email').sort(createdAt:-1)` — usado por admin |
| `actualizar` | `(id, cambios)` | `findOneAndUpdate({_id:id, activo:true}, cambios, {new:true, runValidators:true})` |
| `eliminarLogico` | `(id)` | `findOneAndUpdate({_id:id}, {activo:false}, {new:true})` |
| `inscribirAprendiz` | `(cursoId, aprendiz {id,nombre,correo})` | `findByIdAndUpdate(cursoId, {$addToSet:{inscritos:aprendiz}}, {new:true}).populate(...)` |
| `cancelarInscripcion` | `(cursoId, inscritoId)` | `findByIdAndUpdate(cursoId, {$pull:{inscritos:{_id:inscritoId}}}, {new:true}).populate(...)` |
| `marcarBotEntrenado` | `(id, {totalChunks, documentoOrigenNombre})` | `$set` en `bot.*` + `fechaEntrenamiento` |

### `document.repository.js` → `DocumentRepository`

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosDocumento)` | `Document.create(datosDocumento)` |
| `buscarPorId` | `(id)` | `findById(id).populate('courseId','titulo')` |
| `listarPorCurso` | `(courseId)` | `find({courseId}).sort(createdAt:-1)` |
| `actualizarEstado` | `(id, {estado, errorMessage?, fileUrl?})` | `findByIdAndUpdate(..., {new:true, runValidators:true})` |

### `knowledgeChunk.repository.js` → `KnowledgeChunkRepository`

| Método | Firma | Qué hace |
|---|---|---|
| `guardarLote` | `(chunks)` | `insertMany(chunks)` |
| `buscarPorDocumento` | `(documentId)` | `find({documentId})` |
| `eliminarPorDocumento` | `(documentId)` | `deleteMany({documentId})` |
| `buscarSimilares` | `(courseId, vectorPregunta, limite=5)` | `$vectorSearch` con `filter:{courseId}`, `index:vector_index`, `numCandidates=limite*20`, cosine → `texto`, `metadata`, `documentId`, `score` |

### `chatMessage.repository.js` → `ChatMessageRepository`

| Método | Firma | Qué hace |
|---|---|---|
| `crear` | `(datosMensaje)` | `ChatMessage.create(datosMensaje)` |
| `listarPorThread` | `(threadId)` | `find({threadId}).sort({createdAt:1})` |
| `listarPorCurso` | `(courseId, limite=50)` | `find({courseId}).sort({createdAt:-1}).limit(limite)` |

---

## 3. Services

### `auth.service.js` → `AuthService`

| Método | Firma | Qué hace |
|---|---|---|
| `hashearContraseña` *(privada)* | `(contraseña)` | `bcrypt.genSalt(10)` + `hash` |
| `generarToken` *(privada)* | `(usuario)` | JWT `{id, rol, email}`, `expiresIn=JWT_EXPIRES_IN \|\| '7d'` |
| `serializarUsuario` *(privada)* | `(doc)` | `toObject()` y borra `contraseñaHash`, `__v` |
| `registrar` | `(datos)` | Verifica email duplicado (409), hashea, crea con `perfilMentor` solo si `rol==='mentor'`, serializa |
| `iniciarSesion` | `(credenciales)` | Busca `activo:true` trayendo hash, `bcrypt.compare`, mismo mensaje 401 para no filtrar emails, devuelve `{token, usuario}` |

### `user.service.js` → `UsuarioService` — **nuevo**

| Método | Firma | Qué hace |
|---|---|---|
| `listarUsuarios` | `({ rol, busqueda, pagina, limite })` | Valida `rol` en `['aprendiz','mentor','administrador']` → 400, pagina/limite seguros (limite max 200), delega a `usuarioRepository.listar` |
| `resumenRoles` | `()` | `usuarioRepository.contarPorRol()` |
| `obtenerPorId` | `(id)` | `buscarPorId` → 404 si no existe |
| `crearUsuario` | `({ nombre, email, contraseña, rol })` | Verifica duplicado (409), `bcrypt.genSalt(10)+hash`, `authRepository.crear` con `perfilMentor` si `mentor`, borra hash antes de devolver |
| `cambiarRol` | `(id, nuevoRol, solicitanteId)` | No a sí mismo (403), verifica existencia (404), `usuarioRepository.actualizar(id, {rol:nuevoRol})` |
| `cambiarEstado` | `(id, activo, solicitanteId)` | No desactivarse a sí mismo (`activo===false` + self → 403), verifica existencia, `actualizar(id, {activo})` |

### `course.service.js` → `CursoService`

| Método | Firma | Qué hace |
|---|---|---|
| `crearCurso` | `(mentorId, datosCurso)` | `cursoRepository.crear({ ...datosCurso, mentor:mentorId })` |
| `obtenerCursoPorId` | `(id)` | `buscarPorId` → 404 si no existe |
| `listarCursosPublicados` | `(opciones)` | delega a `listarPublicados` |
| `listarCursosDeMentor` | `(mentorId)` | delega a `listarPorMentor` |
| `listarTodos` | `()` | `cursoRepository.listarTodos()` (admin) |
| `inscribirAprendiz` | `(cursoId, aprendiz)` | Verifica curso existe, verifica `inscritos.some(i=>i.id===aprendiz.id)` (no duplicar), `$addToSet` |
| `cancelarInscripcion` | `(cursoId, inscritoId)` | `$pull` por `_id` de subdocumento |
| `actualizarCurso` | `(id, mentorId, cambios, rol)` | `verificarPropiedad(curso, mentorId, rol)` → `actualizar` |
| `cambiarEstado` | `(id, mentorId, estado, rol)` | verifica propiedad → `actualizar(id,{estado})` |
| `eliminarCurso` | `(id, mentorId, rol)` | verifica propiedad → `eliminarLogico` |
| `generarEstructuraCurso` | `(id, mentorId, rol)` | verifica propiedad, valida `contenidoTextoPlano` existe (400 si no), arma prompt Groq con `contenidoTextoPlano.substring(0,25000)`, `groq.chat.completions.create({model:'llama-3.3-70b-versatile', response_format:{type:'json_object'}, temp:0.3})`, `JSON.parse`, `actualizar(id, {modulos:resultado.modulos, bot:{entrenado:true, fechaEntrenamiento:new Date()}})` |
| `verificarPropiedad` | `(curso, mentorId, rol)` | Si `rol==='administrador'` return (bypass); compara `curso.mentor._id||curso.mentor` vs `mentorId` → 403 |

### `document.service.js` → `DocumentService`

| Método | Firma | Qué hace |
|---|---|---|
| `subirDocumento` | `(mentorId, cursoId, archivo)` | Verifica propiedad, crea `Document` pendiente, sube a Cloudinary `resource_type:'raw'`, `pdf-parse`, `fragmentarTexto(1000,200)`, `embeddingService.generarEmbedding` por chunk, `guardarLote`, actualiza `estado:'completado'` → devuelve `{documento, vistaPrevia}`; en catch marca `error` |
| `listarDocumentosDeCurso` | `(cursoId, mentorId)` | verifica propiedad → `listarPorCurso` |

### `embedding.service.js` → `EmbeddingService` (Singleton)

| Método | Firma | Qué hace |
|---|---|---|
| `obtenerExtractor` | `()` | Inicializa `Xenova/all-MiniLM-L6-v2` una vez, cachea |
| `generarEmbedding` | `(texto)` | `pooling:'mean', normalize:true` → `Array<number>` 384D |

### `rag.service.js` → `RagService`

| Método | Firma | Qué hace |
|---|---|---|
| `responderPregunta` | `(cursoId, pregunta)` | Valida pregunta ≥3, verifica curso, embed pregunta, `buscarSimilares(courseId, vector, 5)`, si vacío → mensaje sin material, arma prompt, `groqProvider.generarRespuesta` → `{respuesta, fragmentosUsados}` |
| `armarPrompt` *(privada)* | `(pregunta, chunks)` | system + context `[Fragmento N]` + user pregunta |

### `groq.provider.js` → `GroqProvider` (implementa `IAssistantProvider`)

| Método | Firma | Qué hace |
|---|---|---|
| `obtenerCliente` | `()` | Lazily `new Groq({apiKey:GROQ_API_KEY})` → 503 si falta |
| `generarRespuesta` | `(mensajes, opciones)` | `groq.chat.completions.create({model:GROQ_MODEL, messages, temperature:0.3, max_tokens:1024})` → `choices[0].message.content`; 502 si vacía/falla |

### `chat.service.js` → `ChatService`

| Método | Firma | Qué hace |
|---|---|---|
| `enviarPregunta` | `(cursoId, aprendizId, pregunta, threadId?)` | Valida curso existe y `estado==='publicado'` (403 si no), genera `threadId=randomUUID()` si falta, guarda pregunta, llama `ragService.responderPregunta`, guarda respuesta bot → `{threadId, respuesta, mensajeId, fragmentosUsados}` |
| `obtenerHistorial` | `(threadId)` | `listarPorThread` |

---

## 4. Controllers

Solo HTTP → Service + `{success, data, message}`.

### `auth.controller.js` (singleton)

| Método | Ruta | Qué hace |
|---|---|---|
| `registrar` | `POST /api/auth/registro` | `authService.registrar(req.body)` → 201 `{success, message, data:{usuario}}` |
| `iniciarSesion` | `POST /api/auth/inicio-sesion` | `authService.iniciarSesion(req.body)` → 200 `{success, message, data:{token, usuario}}` |

### `user.controller.js` (singleton) — **nuevo**

| Método | Ruta | Qué hace |
|---|---|---|
| `listar` | `GET /api/usuarios` | `user.service.listarUsuarios(req.query)` → 200 `{success, data:{usuarios, total, pagina, limite}}` |
| `resumen` | `GET /api/usuarios/resumen` | `user.service.resumenRoles()` → 200 `{success, data:{resumen}}` |
| `crear` | `POST /api/usuarios` | `user.service.crearUsuario(req.body)` → 201 `{success, data:{usuario}}` |
| `cambiarRol` | `PATCH /api/usuarios/:id/rol` | Valida ObjectId → 400, `user.service.cambiarRol(id, rol, req.usuario.id)` → 200 |
| `cambiarEstado` | `PATCH /api/usuarios/:id/estado` | Valida ObjectId → 400, `user.service.cambiarEstado(id, activo, req.usuario.id)` → 200 |

Todos `try/catch → next(error)`.

### `course.controller.js` (singleton)

| Función | Ruta | Qué hace |
|---|---|---|
| `crearCurso` | `POST /api/cursos` | Resuelve `mentorId = req.usuario.id` o `req.body.mentor` si `administrador`, valida mentor rol, `cursoService.crearCurso` → 201 |
| `obtenerCurso` | `GET /api/cursos/:id` | `obtenerCursoPorId` → 200 |
| `listarCursosPublicados` | `GET /api/cursos` | `pagina/limite` query → `listarCursosPublicados` →200 |
| `listarMisCursos` | `GET /api/cursos/mis-cursos` | `listarCursosDeMentor(req.usuario.id)` →200 |
| `listarTodosAdmin` | `GET /api/cursos/admin/todos` | `listarTodos()` →200 (solo admin) |
| `actualizarCurso` | `PATCH /api/cursos/:id` | `actualizarCurso(id, req.usuario.id, body, rol)` →200 |
| `cambiarEstadoCurso` | `PATCH /api/cursos/:id/estado` | `cambiarEstado(id, usuario.id, estado, rol)` →200 |
| `eliminarCurso` | `DELETE /api/cursos/:id` | `eliminarCurso(id, usuario.id, rol)` →200 |
| `inscribirCurso` | `POST /api/cursos/:id/inscribir` | Valida ObjectId, lee `Usuario` (nombre/email), `inscribirAprendiz(cursoId, {id,nombre,correo})` →200; ignora directo a `Usuario` (debt: debería pasar por repository) |
| `cancelarInscripcion` | `DELETE /api/cursos/:id/inscritos/:inscritoId` | `cancelarInscripcion` →200 |
| `generarEstructura` | `POST /api/cursos/:id/generar-estructura` | `generarEstructuraCurso(id, usuario.id, rol)` →200 |

### `document.controller.js` (objeto)

| Método | Ruta | Qué hace |
|---|---|---|
| `subirDocumento` | `POST /api/cursos/:cursoId/documentos` | `req.file` + `documentService.subirDocumento` →201 |
| `listarDocumentos` | `GET /api/cursos/:cursoId/documentos` | `listarDocumentosDeCurso` →200 |
| `verChunks` | `GET /api/cursos/:cursoId/documentos/:documentoId/chunks` | `knowledgeChunkRepository.buscarPorDocumento` directo (debt) →200 |

### `chat.controller.js` (singleton)

| Método | Ruta | Qué hace |
|---|---|---|
| `enviarPregunta` | `POST /api/cursos/:cursoId/chat` | `chatService.enviarPregunta(cursoId, usuario.id, pregunta, threadId)` →200 `{threadId, respuesta, mensajeId, fragmentosUsados}` |
| `obtenerHistorial` | `GET /api/cursos/chat/historial/:threadId` | `chatService.obtenerHistorial` →200 `{mensajes}` |

---

## 5. Middlewares

### `auth.middleware.js` → `verificarToken`

`Authorization: Bearer <token>` requerido → 401 si falta/mal formato, 403 si `jwt.verify` falla, adjunta `req.usuario = {id, rol, email, iat, exp}`.

### `role.middleware.js` → `verificarRol(...roles)`

Debe ir después de `verificarToken`. 401 si `req.usuario.rol` falta, 403 si no está en `roles`.

### `validar.middleware.js` → `validar(esquema)`

`esquema.safeParse(req.body)` (Zod v4); si falla junta `error.issues` → 400 `AppError`; si pasa reemplaza `req.body` con `resultado.data` (limpio).

### `error.middleware.js` → `manejarErrores`

4 args, último en `server.js`. `error.statusCode||500`, `req.log` si existe, responde `{success:false, error:{message}}` (oculta mensaje en 500).

---

## 6. Validators (Zod)

> Zod v4 (`zod@4.4.3`): `error.issues` y `error: () => 'msg'` en enums.

### `auth.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaRegistro` | `nombre` (2–100), `email` (email, lowercase, trim), `contraseña` (8–72), `rol` (enum opcional `aprendiz|mentor|administrador`), `perfilMentor` (`{bio?, especialidad?}` opcional) |
| `esquemaInicioSesion` | `email` (email, lowercase, trim), `contraseña` (min 1) |

### `course.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaCrearCurso` | `titulo` (3–120), `descripcion` (10–2000), `categoria` (2–60), `precio` (≥0 opcional), `duracionEstimadaHoras` (≥0 opcional), `mentor` (string opcional para admin) |
| `esquemaActualizarCurso` | `esquemaCrearCurso.partial()` |
| `esquemaCambiarEstado` | `estado` (enum `borrador|publicado|archivado`, `error: ()=>'Estado inválido'`) |

### `chat.validator.js`

| Esquema | Campos |
|---|---|
| `esquemaPregunta` | `pregunta` (trim, 3–1000), `threadId` (UUID v4 opcional) |

### `user.validator.js` — **nuevo**

| Esquema | Campos |
|---|---|
| `esquemaCrearUsuario` | `nombre` (2–100), `email` (email, lowercase, trim), `contraseña` (8–72), `rol` (enum `aprendiz|mentor|administrador`, `error:...`) |
| `esquemaCambiarRol` | `rol` (enum igual) |
| `esquemaCambiarEstado` | `activo` (boolean, `error: 'El campo activo debe ser verdadero o falso'`) |

---

## 7. Utils

### `AppError.js` → `AppError`

Extiende `Error`, `(message, statusCode=500)`, `this.statusCode`, `Error.captureStackTrace`. Única forma de lanzar errores desde services.

### `textChunker.js` → `fragmentarTexto`

`fragmentarTexto(texto, chunkSize=1000, overlap=200)` — limpia `\s+`, itera `chunkSize-overlap`, devuelve `string[]` (vacío si `texto` falsy).

### `assistant-provider.interface.js` → `IAssistantProvider` (abstracta)

Strategy Pattern: `generarRespuesta(mensajes, opciones) => Promise<string>`. Implementaciones: `groq.provider.js` (y futuro OpenAI etc). `rag.service` y `course.service.generarEstructuraCurso` solo conocen esta interfaz.

---

## 8. Config

### `database.js` → `conectarBaseDatos`

Lee `MONGODB_URI`, listeners `connected/error/disconnected`, `mongoose.connect(uri)`. Invocada antes de `app.listen` en `server.js`.

### `cloudinary.js` → `cloudinary` (default export)

Configura SDK v2 con `CLOUDINARY_CLOUD_NAME/KEY/SECRET`, exporta instancia para `document.service.js` (`resource_type:'raw'`, carpeta `mentorsync/documentos`).

---

## 9. Endpoints montados actualmente

Base URL: `http://localhost:4000`

### `/api/auth` (público salvo donde se indica)

| Método | Ruta | Middleware | Body / Query |
|---|---|---|---|
| `POST` | `/api/auth/registro` | `validar(esquemaRegistro)` | `{ nombre, email, contraseña, rol?, perfilMentor? }` |
| `POST` | `/api/auth/inicio-sesion` | `validar(esquemaInicioSesion)` | `{ email, contraseña }` |
| `GET` | `/api/auth/perfil-protegido` | `verificarToken` + `verificarRol('aprendiz','mentor','administrador')` | — (prueba JWT) |

### `/api/usuarios` — **módulo admin (solo `administrador`)**

| Método | Ruta | Middleware | Notas |
|---|---|---|---|
| `GET` | `/api/usuarios` | `verificarToken` + `verificarRol('administrador')` | Query `rol`, `busqueda`, `pagina`, `limite` (max 200) → `{usuarios, total, pagina, limite}` |
| `GET` | `/api/usuarios/resumen` | `verificarToken` + `verificarRol('administrador')` | → `{resumen:{administrador, mentor, aprendiz, total}}` |
| `POST` | `/api/usuarios` | `verificarToken` + `verificarRol('administrador')` + `validar(esquemaCrearUsuario)` | Crea usuario con rol arbitrario (evita duplicado 409) |
| `PATCH` | `/api/usuarios/:id/rol` | `verificarToken` + `verificarRol('administrador')` + `validar(esquemaCambiarRol)` | No a sí mismo (403), valida ObjectId |
| `PATCH` | `/api/usuarios/:id/estado` | `verificarToken` + `verificarRol('administrador')` + `validar(esquemaCambiarEstado)` | No desactivarse a sí mismo, valida ObjectId |

### `/api/cursos`

| Método | Ruta | Middleware | Notas |
|---|---|---|---|
| `GET` | `/api/cursos` | — (público) | Query `pagina`, `limite`. Solo `estado:'publicado'` |
| `GET` | `/api/cursos/mis-cursos` | `verificarToken` + `verificarRol('mentor')` | Antes de `/:id` |
| `GET` | `/api/cursos/admin/todos` | `verificarToken` + `verificarRol('administrador')` | Antes de `/:id`, todos `activo:true` sin filtrar estado |
| `GET` | `/api/cursos/:id` | — (público) | |
| `POST` | `/api/cursos` | `verificarToken` + `verificarRol('mentor','administrador')` + `validar(esquemaCrearCurso)` | Si `administrador` y `body.mentor`, asigna a ese mentor (valida rol mentor) |
| `POST` | `/api/cursos/:id/generar-estructura` | `verificarToken` + `verificarRol('mentor')` | Genera `modulos/lecciones` vía Groq JSON (requiere `contenidoTextoPlano`) |
| `POST` | `/api/cursos/:id/inscribir` | `verificarToken` | Inscribe aprendiz (`inscritos[]` con `$addToSet`), evita duplicado |
| `DELETE` | `/api/cursos/:id/inscritos/:inscritoId` | `verificarToken` + `verificarRol('aprendiz')` | `$pull` por `_id` de subdocumento |
| `PATCH` | `/api/cursos/:id` | `verificarToken` + `verificarRol('mentor','administrador')` + `validar(esquemaActualizarCurso)` | Verifica propiedad (admin bypass) |
| `PATCH` | `/api/cursos/:id/estado` | `verificarToken` + `verificarRol('mentor','administrador')` + `validar(esquemaCambiarEstado)` | |
| `DELETE` | `/api/cursos/:id` | `verificarToken` + `verificarRol('mentor','administrador')` | Soft delete `activo:false` |

### `/api/cursos` — documentos y chat

| Método | Ruta | Middleware | Notas |
|---|---|---|---|
| `POST` | `/api/cursos/:cursoId/documentos` | `verificarToken` + `verificarRol('mentor')` + `multer.single('archivo')` | `multipart/form-data` `archivo` (PDF, 15 MB), síncrono → Cloudinary + chunks |
| `GET` | `/api/cursos/:cursoId/documentos` | `verificarToken` + `verificarRol('mentor')` | Lista documentos de curso |
| `GET` | `/api/cursos/:cursoId/documentos/:documentoId/chunks` | `verificarToken` + `verificarRol('mentor')` | Chunks de documento |
| `POST` | `/api/cursos/:cursoId/chat` | `verificarToken` + `validar(esquemaPregunta)` | `{pregunta, threadId?}` → `{threadId, respuesta, mensajeId, fragmentosUsados}` (curso debe estar `publicado`) |
| `GET` | `/api/cursos/chat/historial/:threadId` | `verificarToken` | Historial de hilo ordenado cronológicamente |

Verificados 2026-08-31 (auth/cursos), 2026-09-01 (documentos/chat), 2026-09-22 (usuarios admin + inscribir/estructura) con Bruno.

---

## 10. Dependencias clave y versiones

Extraídas de `backend/package.json`.

| Dependencia | Versión | Qué hace |
|---|---|---|
| `@xenova/transformers` | `^2.17.2` | Embeddings local `all-MiniLM-L6-v2`, 384D, CPU, cache ~30MB |
| `bcryptjs` | `^3.0.3` | Hash contraseñas (salt 10) |
| `cloudinary` | `^2.11.0` | PDFs `raw`, carpeta `mentorsync/documentos` |
| `compression` | `^1.8.1` | gzip |
| `cors` | `^2.8.6` | CORS global |
| `dotenv` | `^16.4.7` | `.env` |
| `express` | `^4.21.2` | Framework |
| `express-mongo-sanitize` | `^2.2.0` | Limpia `body/query/params` |
| `express-rate-limit` | `^8.6.2` | 300/15min |
| `groq-sdk` | `^0.15.0` | Groq `chat.completions.create` (RAG + estructura) |
| `helmet` | `^8.3.0` | Headers |
| `jsonwebtoken` | `^9.0.3` | JWT `{id,rol,email}` |
| `mongodb` | `^7.6.0` | Driver nativo (via Mongoose) |
| `mongoose` | `^8.9.5` | ODM |
| `multer` | `^1.4.5-lts.2` | `multipart/form-data` 15 MB |
| `pdf-parse` | `^1.1.1` | Extracción texto PDF |
| `pino` + `pino-http` | `^10.3.1` / `^11.0.0` | Logging JSON (`pino-pretty` en dev) |
| `sharp` | `^0.35.4` | Procesado imágenes (nuevo) |
| `socket.io` | `^4.8.3` | Instalado, no usado (futuro vivo) |
| `streamifier` | `^0.1.1` | Buffer→stream para Cloudinary |
| `swagger-jsdoc` + `swagger-ui-express` | `^6.3.0` / `^5.0.1` | Instalados, no montados |
| `validator` | `^13.15.35` | Validaciones extra (nuevo) |
| `zod` | `^4.4.3` | Validación (v4: `error.issues`, `error:`) |

Engines: `node >=24.20.0`.

### Variables de entorno (`.env`)

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

`GROQ_API_KEY`/`GROQ_MODEL` necesarias para chat y `generar-estructura`. Servidor arranca sin ellas (lazy init), pero esas rutas lanzan 503 si faltan. `check-setup.js` valida `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (8 vars).

---

## 11. Deuda técnica / inconsistencias detectadas

**Corregidos:**
- ✅ `course.service` / `course.routes` imports default → named exports.
- ✅ Modelos ESM (`require` → `import`) y refs `User/Course` → `Usuario/Curso`.
- ✅ `validar.middleware` `error.errors` → `error.issues` (Zod v4).
- ✅ `course.validator` `errorMap` → `error`.
- ✅ `auth.repository` creado y `auth.service` lo usa.
- ✅ `verificarPropiedad` ahora `verificarPropiedad(curso, mentorId, rol)` con bypass `administrador`.
- ✅ Formato respuesta `course.controller` unificado a `{success, data, message}` (antes `{exito, curso}`).
- ✅ Módulo `user` (repository/service/controller/validator/routes) implementado.
- ✅ `course.model` `inscritos` + `modulos/lecciones` + `contenidoTextoPlano` + `estado` default `publicado` implementados.
- ✅ `course.repository` `listarTodos`/`inscribirAprendiz`/`cancelarInscripcion` y `course.service` `generarEstructuraCurso` implementados.

**Pendiente (no bloquea MVP, pero fuera de convención):**
- [ ] Sin bloques `@openapi` ni `swagger-ui-express` montado (`// TODO` en `server.js`).
- [ ] `enrollment`/`liveSession` solo modelo, sin repository/service.
- [ ] `course.controller.inscribirCurso` importa `Usuario` directo (debería usar `authRepository`/`userRepository`).
- [ ] `document.controller.verChunks` llama `knowledgeChunkRepository` directo sin pasar por service.
- [ ] `esquemaInicioSesion.contraseña` con `min(1)` es intencional (no valida política en login), pero debería comentarse.
- [ ] `enrollment.model.progreso` sin `min/max`.
- [ ] `check-setup.js` no valida Cloudinary ni `GROQ_MODEL`; `course.repository.listarPublicados` aún loguea con `console.log`.
- [ ] Frontend `roleGuard` usa roles capitalizados (`Aprendiz|Mentor|Administrador`) mientras backend usa minúsculas — funciona vía `authService.rolCoincide` (case-sensitive mapeado), pero conviene unificar.

---

*Última revisión: 2026-09-22. Actualizar este documento cada vez que se agregue un método, modelo, middleware o validator nuevo.*
