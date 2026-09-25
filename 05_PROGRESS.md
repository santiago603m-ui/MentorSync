# 📈 Bitácora de Avance — MentorSync AI

> Actualizar esta bitácora al cerrar cada sprint o al terminar una funcionalidad relevante.
> Formato: fecha, qué se hizo, decisiones tomadas, qué sigue.

## Cómo usar este archivo

- Cada entrada nueva va arriba (orden cronológico inverso).
- Si tomaste una decisión de arquitectura nueva, regístrala aquí Y actualiza el doc correspondiente (`01_ARCHITECTURE.md`, `02_FRONTEND_GUIDELINES.md`, etc.) — este archivo es historial, los otros son la verdad vigente.

---

## [2026-09-24] — Eliminación de modos de diseño claro (light) y cyberpunk (fijado a tema oscuro)

**Hecho:**
- Eliminadas las reglas CSS de `body.theme-cyberpunk` y `[data-theme="light"]` en `frontend/src/styles.css`.
- Simplificado `frontend/src/app/shared/services/theme.service.ts`: se eliminaron los métodos `isLight`, `isCyberpunk`, `toggle` y `toggleMode`, fijando el tema exclusivamente en `mode: 'dark'`.
- Limpieza en `responsive-layout.component.ts`: eliminada la inyección de `ThemeService` y la bifurcación condicional de colores de partículas neón cyberpunk; fijados colores de constelación por defecto (`139, 107, 255` y `34, 211, 238`).
- Limpieza en `vanta-background.component.ts`: eliminado `COLOR_POR_MODO` con color light; fijado a `COLOR_FONDO_VANTA = 0x1b1035`.
- Actualizada toda la documentación maestra (`00_PROJECT_CONTEXT.md`, `01_ARCHITECTURE.md`, `02_FRONTEND_GUIDELINES.md`, `README.md`) para reflejar que la interfaz opera únicamente bajo el tema oscuro glassmorphic.

**Decisiones:**
- Unificar la experiencia visual en un único tema oscuro cohesivo, reduciendo complejidad innecesaria de CSS y sincronización de estado.

---

## [2026-09-22] — Socket.io para reuniones en vivo (backend)

**Hecho:**
- Implementado `LiveSession` completo: `liveSession.repository.js` (`crear`, `buscarPorId`, `listarPorCurso`, `listarTodas`, `actualizar`, `agregarAsistente`), `liveSession.service.js` (`crearSesion` con verificación `cursoService.obtenerCursoPorId` + permiso mentor dueño o `administrador` bypass, `listarPorCurso`, `obtenerPorId`, `cambiarEstado` con `fechaInicioReal`/`fechaFin` automáticas, `unirse`), `liveSession.validator.js` (`esquemaCrearSesion`, `esquemaCambiarEstadoSesion`, `esquemaMensajeSala`), `liveSession.controller.js` (5 handlers + `listarMensajes` vía `chatMessageRepository.listarPorSesion`), `liveSession.routes.js` montado en `POST /api/sesiones`, `GET /api/sesiones/curso/:cursoId`, `GET /api/sesiones/:id`, `GET /api/sesiones/:id/mensajes`, `PATCH /api/sesiones/:id/estado`.
- Extendida `chatMessage.repository.js` con `listarPorSesion(liveSessionId)`.
- Socket.io: creado `backend/src/sockets/index.js` con `verificarTokenSocket` (lee `handshake.auth.token` o `Authorization: Bearer`), `configurarSockets(io)` que maneja `connection` → eventos `sala:unirse` (valida ObjectId, verifica `LiveSession` no cancelada, `socket.join(room)`, `agregarAsistente`, broadcast `sala:usuario_unido`), `sala:mensaje` (valida room membership, persiste `ChatMessage` con `courseId/liveSessionId/remitenteId/rolRemitente`, broadcast `sala:mensaje_nuevo` a `sesion:{id}`), `sala:escribiendo` (broadcast `sala:escribiendo`), `sala:abandonar` + `disconnect` (broadcast `sala:usuario_salio`, `mentor_desconectado` si `rol===mentor`, y `bot_activado` vía evento `bot_activado`).
- `backend/src/server.js` ahora crea `httpServer = createServer(app)` + `io = new Server(httpServer, {cors:{origin:'*'}})` + `configurarSockets(io)` y monta `liveSessionRoutes` en `/api/sesiones`. `httpServer.listen` reemplaza `app.listen`.

**Decisiones:**
- Mantener ESM y `AppError` con `code` (ej. `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`) en sockets (callback `{success, message, code}`) y HTTP.
- Room por `sesion:${liveSessionId}` (no por `courseId`) para aislar cada reunión; la sesión guarda `courseId` para mapear a curso y para persistencia de `ChatMessage`.
- Auth de socket reutiliza `JWT_SECRET` y payload `{id, rol, email}` idéntico al HTTP; no se requiere nuevo middleware.
- `liveSession.estado` enum `programada|en_curso|finalizada|cancelada` con transiciones gestionadas por `cambiarEstado`; `urlReunion` opcional para futuro WebRTC/Jitsi.

**Pendiente:**
- Swagger en `/api-docs`, deuda `inscribirCurso`/`verChunks` sigue pendiente (próximos pasos 3 y 4).

---

## [2026-09-22] — Sidebar Atlas + actualizacion de documentacion

**Hecho:**
- Revisión completa de los 7 `.MD` (README + 00-06) y actualización a estado real del repo (corrección de claims desactualizados).
- Sidebar remodelada a estilo **MongoDB Atlas**: rail de iconos 56px siempre visible + panel explorer 280px glassmorphism con auto-hide hover (total 336px, 100vh), `ThemeService` + Vanta background intactos. Logos decorativos (`fa-atom`/`fa-server`/`fa-database`/`fa-brain`) visibles solo colapsado.
- Fix Font Awesome: agregado CDN `6.5.2` en `frontend/src/index.html` (los `fas` no cargaban, rail aparecía vacío).
- `COLLECCIONES / Cluster0` eliminado del explorer por petición (ahora solo header + nav filtrada).

**Decisiones:**
- Mantener ESM, Repository Pattern y filtro obligatorio `courseId` en RAG. Nuevo `sharp`/`validator` documentado.

---

## [2026-09-22] — Reaplicados 2 arreglos de §8 (AppError code + check-setup)

**Hecho:**
- Verificado `backend/src/utils/AppError.js`: ya tenía soporte `code` (constructor `message, statusCode=500, code=null` + `codigoPorDefecto(statusCode)`) y `middlewares/error.middleware.js` ya expone `{ error: { code, message } }` (code derivado del statusCode si no se pasa explícito). No requirió cambio — se confirmó que el arreglo previo sí persistió.
- Corregido `backend/scripts/check-setup.js`: ahora valida 8 variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) en vez de solo 4. Antes no validaba Cloudinary/GROQ_MODEL.

**Decisiones:**
- Mantener firma `AppError(message, statusCode, code)` con code opcional y fallback a mapa por statusCode (400→BAD_REQUEST, 401→UNAUTHORIZED, 403→FORBIDDEN, 404→NOT_FOUND, 409→CONFLICT, 422→UNPROCESSABLE, 500→INTERNAL_ERROR). Así los `throw new AppError(msg, status)` existentes siguen funcionando.
- `check-setup` ahora falla explícitamente si falta Cloudinary (requerido para subida de PDFs) o `GROQ_MODEL` (requerido para RAG/estructura).

---

## [2026-09-20 → 2026-09-22] — Panel Admin + modulo usuarios + inscripciones + estructura IA (frontend + backend)

**Hecho:**
- **Backend admin (`/api/usuarios`):** `user.repository` (`listar` con filtros `$or` nombre/email, `contarPorRol` aggregate, `buscarPorId`, `actualizar`), `user.service` (`listarUsuarios`, `resumenRoles`, `crearUsuario` con hash, `cambiarRol`/`cambiarEstado` con anti auto-cambio), `user.controller` (5 handlers), `user.validator` (Zod v4 `esquemaCrearUsuario`/`esquemaCambiarRol`/`Estado`), `user.routes` (`router.use(verificarToken, verificarRol('administrador'))`). Montado en `server.js` como `/api/usuarios` (rutas: `GET /`, `GET /resumen`, `POST /`, `PATCH /:id/rol`, `PATCH /:id/estado`).
- **Backend cursos:** `curso.model` extendido con `inscritos: [{id, nombre, correo, _id}]`, `contenidoTextoPlano`, `modulos[]` (`titulo, descripcion, orden, lecciones[] {titulo, contenido, puntosClave, orden}`), `estado` default `publicado`. Repository: `inscribirAprendiz ($addToSet)`, `cancelarInscripcion ($pull)`, `listarTodos` (`activo:true`). Service: `inscribirAprendiz`/`cancelarInscripcion` + `generarEstructuraCurso` (Groq `llama-3.3-70b-versatile`, `response_format:json_object`, parsea `modulos`, actualiza `bot.entrenado`). Controller: `inscribirCurso`/`cancelarInscripcion` (valida ObjectId, lee `Usuario`), `listarTodosAdmin`, `generarEstructura`, `crearCurso` con asignación `body.mentor` si `administrador`. Routes: `GET /admin/todos` (admin), `POST /:id/generar-estructura` (mentor), `POST /:id/inscribir` (auth), `DELETE /:id/inscritos/:inscritoId` (aprendiz) + bypass `administrador` en `verificarPropiedad`.
- **Frontend admin:** `AdminService` (`listarUsuarios`, `resumenRoles`, `cambiarRol/Estado`, `crearUsuario`, `listarTodosCursos`, `crearCurso`, `cambiarEstadoCurso`, `eliminarCurso`), `AdminPageComponent` (carga `forkJoin` usuarios/resumen/cursos, KPIs `cursosPorEstado/totalInscripciones/usuariosActivos/crecimientoMensual`), `AdminDashboardQuickComponent` (doughnut roles, barras semanales, crecimiento, estado sistema), `admin.models.ts` (`UsuarioApi { _id, activo, rol minusculas, createdAt }`, `CursoApi { estado borrador|publicado|archivado, inscritos[] }`).
- **Frontend shared:** `SidebarComponent` Atlas (previamente dock 72→260px, ahora rail 56 + panel 280 auto-hide), `ThemeService` (signals `mode` dark/light + `isCyberpunk`, `data-theme`/`theme-cyberpunk`, localStorage `mentorsync-mode`/`mentorsync-theme`), `VantaBackgroundComponent` wrapper de todas las rutas.
- **Home remodelada:** hero SVG draw-line loop + spotlight/tilt/typewriter, marquee infinito, stats counters con `IntersectionObserver`, timeline con `timeline-fill` scrolleable, bento spotlight, CTA borde cónico, todo `prefers-reduced-motion` safe.
- **Routing:** `VantaBackgroundComponent` como layout, `roleGuard` con `data.roles: ['Aprendiz','Mentor','Administrador']`, `AuthComponent` unificada (`/auth` + redirects `/login`/`/registro`), dependencias nuevas `animejs`, `gsap`, `three`, `vanta`, `sharp`.
- **Bruno:** nueva carpeta `Admin/` con 11 casos (login admin, listar/resumen, cambiar rol/estado, errores sin permiso/auto-cambio, admin todos/crear).

**Decisiones:**
- Inscritos embebidos en `Curso` (no colección `enrollments` separada) para MVP.
- Generación de estructura síncrona (25k chars max) — si crece, extraer a job.
- Sidebar pantalla completa (100vh) overlay hover, no push layout; mobile dock inferior.

**Verificación:** `npx tsc --noEmit -p tsconfig.app.json` limpio. Bruno Admin verificado.

---

## [Sin iniciar] — Setup inicial (actualizado 2026-09-22)

**Hecho:**
- Arquitectura MEAN + RAG con Groq + Atlas Vector Search definida
- 3 roles definidos e implementados (RBAC backend + roleGuard frontend)
- Cluster Atlas + índice `vector_index` (384D, cosine, filter `courseId`) configurados
- Setup Express completo (middlewares, repositories, validators Zod v4)
- Setup Angular 22 completo (standalone + SSR, glassmorphism, Vanta, GSAP)
- Auth (registro/login JWT), pipeline chunking/embeddings, VectorSearch + Groq, chatbot end-to-end, módulo admin, panel admin con sidebar Atlas, inscripciones y generación de estructura

**Pendiente / próximos pasos:**
- [ ] Sockets en vivo (`src/sockets/` vacío, Socket.io instalado)
- [ ] Swagger UI montado en `/api-docs` (instalado, no montado)
- [ ] Migrar inscripciones a `enrollments` si escala, y validaciones de `progreso`/Cloudinary en `check-setup.js`

---

## [2026-09-01] — 🎉 RAG y Chatbot completos: pipeline end-to-end funcional

**Hecho:**
- Implementado módulo completo de **chatbot RAG** con repository, service, controller y routes.
- **Búsqueda vectorial** con MongoDB Atlas `$vectorSearch`:
  - `knowledgeChunkRepository.buscarSimilares(courseId, vectorPregunta, limite)` — búsqueda semántica con filtro obligatorio por `courseId` (Strategy Pattern para aislar contenido entre cursos).
  - Índice `vector_index` sobre campo `embedding` con `numCandidates = limite * 20` y similarity `cosine`.
- **Integración con Groq API** para generación de respuestas:
  - `groq.provider.js` implementa `IAssistantProvider` (Strategy Pattern).
  - Modelo por defecto configurable vía `GROQ_MODEL` (`.env`).
  - Cliente Groq se inicializa perezosamente al primer uso — el servidor puede arrancar aunque `GROQ_API_KEY` no esté configurada todavía.
  - Manejo de errores robusto con `AppError` custom por código (`GROQ_NOT_CONFIGURED`, `GROQ_EMPTY_RESPONSE`, `GROQ_REQUEST_FAILED`).
- **Servicio RAG** (`rag.service.js`):
  - Embebe la pregunta con el mismo modelo que los documentos (`Xenova/all-MiniLM-L6-v2`).
  - Busca los 5 chunks más relevantes del curso (solo ese curso, nunca mezcla con otros).
  - Arma prompt con contexto + pregunta + instrucciones para el modelo.
  - Llama a Groq para generar la respuesta.
  - Devuelve respuesta + fragmentos usados (con `score` y vista previa de cada uno).
- **Servicio de chat** (`chat.service.js`):
  - `enviarPregunta(cursoId, aprendizId, pregunta, threadId?)` — crea conversación nueva si no viene `threadId` (UUID v4), valida que el curso esté publicado, guarda pregunta del aprendiz en `chatmessages`, llama al RAG, guarda respuesta del bot, devuelve `threadId` + respuesta + fragmentos.
  - `obtenerHistorial(threadId)` — lista todos los mensajes de un hilo (ordenados por `createdAt` ascendente).
- **Repository de chat** (`chatMessage.repository.js`): métodos `crear`, `listarPorThread`, `listarPorCurso`.
- **Validator de chat** (Zod): `esquemaPregunta` valida `pregunta` (3-1000 caracteres) y `threadId` opcional (UUID).
- **Rutas implementadas:**
  - `POST /api/cursos/:cursoId/chat` — envía pregunta al bot del curso (requiere autenticación, cualquier rol).
  - `GET /api/cursos/chat/historial/:threadId` — obtiene historial de un hilo (requiere autenticación).
- **Colección Bruno API** completa con 4 casos de prueba de chat (nueva conversación, mismo hilo, historial, error curso no publicado).

**Decisiones técnicas:**
- **Strategy Pattern** (`IAssistantProvider`): permite cambiar de proveedor de IA sin tocar `rag.service.js`.
- **Temperatura baja (0.3)** por defecto: reduce alucinaciones.
- **Max tokens (1024)** por defecto: respuestas concisas.
- **Contexto limitado a 5 chunks**: ~5000 chars (~1250 tokens).
- **Filtro obligatorio por `courseId`** en `$vectorSearch`.
- **`threadId` como UUID v4**: identificador único de conversación.

**Verificación:**
- Se probó manualmente con Bruno API: envío de pregunta nueva, continuación de conversación, obtención de historial, validación de que solo funciona con cursos publicados.

**Impacto:**
- 🎉 **El núcleo de valor del producto está completo**: mentor sube PDF → bot entrenado → aprendiz pregunta → bot responde con contexto del curso.
- Frontend Angular ya implementado (antes pendiente).

---

## [2026-09-01] — Refactorización: auth.repository.js implementado

**Hecho:**
- Creado `auth.repository.js` con métodos `buscarPorEmail`, `buscarPorEmailConContraseña` (trae `contraseñaHash` con `select: false` + filtra `activo: true`), y `crear`.
- Refactorizado `auth.service.js` para usar `authRepository` en vez de importar el modelo `Usuario` directamente.
- El proyecto ahora cumple completamente el Repository Pattern en todos los módulos implementados (auth, course, document).

---

## [2026-09-01] — Pipeline de chunking y embeddings: módulo de documentos completo

**Hecho:**
- Implementado módulo completo de **documentos** con repository, service, controller y routes.
- Integración con **Cloudinary** para almacenamiento de PDFs (carpeta `mentorsync/documentos`, archivos marcados como `resource_type: 'raw'`).
- Pipeline end-to-end de procesamiento de PDFs:
  1. Mentor sube PDF vía `POST /api/cursos/:cursoId/documentos` (multer, máx 15 MB).
  2. Se crea registro `Document` en estado `pendiente`.
  3. PDF se sube a Cloudinary → URL persistente.
  4. Extracción de texto con `pdf-parse`.
  5. Fragmentación con `textChunker.js` (chunks de 1000 caracteres, overlap de 200).
  6. Generación de embeddings con `@xenova/transformers` (modelo `Xenova/all-MiniLM-L6-v2`, vectores de 384 dimensiones, **sin GPU ni API externa** — corre en CPU puro).
  7. Guardado en lote de chunks + vectores en colección `knowledgechunks`.
  8. Documento marcado como `completado` con URL de Cloudinary.
- Agregados repositorios: `document.repository.js` (CRUD de documentos) y `knowledgeChunk.repository.js` (guardado en lote, consulta por documento, eliminación por documento).
- Agregado `embedding.service.js` con Singleton pattern para reutilizar el pipeline de transformers entre múltiples requests (la primera ejecución descarga el modelo ~30MB y lo cachea localmente).
- Agregadas utilidades: `textChunker.js` (fragmentación con overlap para preservar contexto), `AppError.js` ya estaba, `streamifier` para convertir buffer → stream (requerido por Cloudinary).
- Rutas implementadas:
  - `POST /api/cursos/:cursoId/documentos` — sube y procesa PDF, devuelve vista previa (total de páginas, caracteres, fragmentos, dimensiones del vector, primer fragmento).
  - `GET /api/cursos/:cursoId/documentos` — lista documentos de un curso.
  - `GET /api/cursos/:cursoId/documentos/:documentoId/chunks` — devuelve los chunks generados para un documento específico (útil para debugging del pipeline).

**Decisiones técnicas:**
- El procesamiento es **síncrono** (dentro del mismo request de subida) porque el tiempo de respuesta con PDFs pequeños (<5 MB, ~50-100 páginas) es aceptable (5-15 segundos). Si en producción se suben PDFs grandes (>10 MB, >200 páginas), conviene extraer a un job asíncrono (Bull/BullMQ + Redis).
- Cloudinary en vez de filesystem local o S3 directo: simplicidad (SDK maduro, CDN incluido, free tier de 10 GB).
- `@xenova/transformers` en vez de llamar a una API de embeddings (OpenAI, Cohere, etc.): **sin costo por request** y sin latencia de red. Tradeoff: CPU-bound (cada embedding toma ~50-200ms dependiendo del hardware del servidor).
- Overlap de 200 caracteres entre chunks: evita que conceptos que aparecen en el límite entre dos fragmentos se "rompan" — el contexto se preserva parcialmente.

**Deuda técnica nueva detectada:**
- ✅ **Corregido** — `auth.repository.js` implementado.
- [ ] `check-setup.js` no valida las variables de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) pero sí valida `GROQ_API_KEY`.
- [ ] `document.controller.verChunks` llama `knowledgeChunkRepository` directamente sin pasar por un service — rompe la convención de capas.
- [ ] Si el procesamiento falla, el documento queda en estado `pendiente` en vez de `error`.
- [ ] Formato de respuesta ya unificado (antes inconsistente `exito` vs `success`).

---

## [2026-08-31] — Code review: bugfixes en auth + módulo de cursos, nueva doc de referencia

**Hecho:**
- Revisión completa del código de backend existente (auth, cursos, middlewares, validators, modelos).
- Creado `06_API_MODELS_REFERENCE.md`: referencia detallada método por método.
- Actualizado `04_DATABASE_SCHEMA.md` para reflejar esquema real.

**Bugs corregidos** (verificados con pruebas manuales):
- `course.service.js` importaba `AppError` como default export; solo existe como named export.
- `course.routes.js` importaba `verificarToken`/`verificarRol`/`validar` como default exports; son named exports.
- 5 modelos usaban CommonJS en proyecto ESM. Convertidos.
- Modelos referenciaban `ref: 'User'`/`'Course'` en vez de `'Usuario'`/`'Curso'`.
- `validar.middleware.js` usaba `error.errors` (Zod v3); en v4 es `error.issues`.
- `course.validator.js` usaba `errorMap` (Zod v3) en vez de `error` (Zod v4).

**Deuda registrada (ver detalle en `06_API_MODELS_REFERENCE.md` §11):**
- [x] Falta `auth.repository.js` → corregido.
- [x] Formato respuesta inconsistente → unificado a `{success, data, message}`.
- [x] `verificarPropiedad` sin bypass `administrador` → corregido (ahora `verificarPropiedad(curso, mentorId, rol)`).
- [ ] Sin bloques `@openapi` ni `swagger-ui-express` montado.
- [ ] `enrollment`/`liveSession` solo modelo, sin repository/service.

---
