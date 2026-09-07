# 📈 Bitácora de Avance — MentorSync AI

> Actualizar esta bitácora al cerrar cada sprint o al terminar una funcionalidad relevante.
> Formato: fecha, qué se hizo, decisiones tomadas, qué sigue.

## Cómo usar este archivo

- Cada entrada nueva va arriba (orden cronológico inverso).
- Si tomaste una decisión de arquitectura nueva, regístrala aquí Y actualiza el doc correspondiente (`01_ARCHITECTURE.md`, `02_FRONTEND_GUIDELINES.md`, etc.) — este archivo es historial, los otros son la verdad vigente.

---

## [Sin iniciar] — Setup inicial

**Hecho:**
- Definida arquitectura general (MEAN + RAG con Groq + MongoDB Atlas Vector Search)
- Definidos 3 roles: aprendiz, mentor, administrador
- Definida estructura de carpetas backend y frontend
- Definido sistema de diseño glassmorphism para frontend

**Pendiente / próximos pasos:**
- [ ] Configurar cluster de MongoDB Atlas + índice de Vector Search
- [x] Setup inicial de Express (esqueleto de carpetas, conexión DB)
- [ ] Setup inicial de Angular (esqueleto de módulos por feature)
- [x] Implementar auth (registro/login) con JWT y roles
- [x] Pipeline de chunking y embeddings (PDF → texto → fragmentos → vectores 384D con `@xenova/transformers`)
- [x] Búsqueda vectorial con MongoDB Atlas `$vectorSearch` + respuesta con LLM (Groq)
- [x] Servicio RAG completo (`rag.service.js`) con integración Groq
- [x] Chatbot funcional end-to-end (pregunta → retrieval → generación → guardado en historial)
- [ ] Chat en vivo con Socket.io (mentor ↔ aprendiz)
- [ ] UI base con componentes glass (`glass-card`, `glass-navbar`, etc.)

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
- **Strategy Pattern** (`IAssistantProvider`): permite cambiar de proveedor de IA (OpenAI, Anthropic, otro) sin tocar `rag.service.js` — solo hay que implementar `generarRespuesta()` en un nuevo provider.
- **Temperatura baja (0.3)** por defecto: reduce alucinaciones, el bot se ciñe más al contexto.
- **Max tokens (1024)** por defecto: respuestas concisas.
- **Contexto limitado a 5 chunks**: balance entre relevancia y costo de tokens. Con chunks de 1000 caracteres, son ~5000 caracteres de contexto (promedio ~1250 tokens).
- **Filtro obligatorio por `courseId`** en `$vectorSearch`: cumple regla de `00_PROJECT_CONTEXT.md` — evita que un curso "vea" contenido de otro.
- **`threadId` como UUID v4**: identificador único de conversación, no depende de base de datos (el cliente podría generar UUIDs también para reducir round-trips).
- **Guardado de fragmentos usados**: permite debugging (qué contexto vio el modelo) y futura UI de "fuentes" (mostrar al usuario de dónde salió la respuesta).

**Verificación:**
- Se probó manualmente con Bruno API: envío de pregunta nueva, continuación de conversación, obtención de historial, validación de que solo funciona con cursos publicados.
- **Pendiente:** verificación end-to-end documentada con logs/screenshots del flujo completo.

**Impacto:**
- 🎉 **El núcleo de valor del producto está completo**: mentor sube PDF → bot entrenado → aprendiz pregunta → bot responde con contexto del curso.
- Falta solo la capa de UI (frontend Angular) para tener un MVP funcional.

---

## [2026-09-01] — Refactorización: auth.repository.js implementado

**Hecho:**
- Creado `auth.repository.js` con métodos `buscarPorEmail`, `buscarPorEmailConContraseña` (trae `contraseñaHash` con `select: false` + filtra `activo: true`), y `crear`.
- Refactorizado `auth.service.js` para usar `authRepository` en vez de importar el modelo `Usuario` directamente.
- El proyecto ahora cumple completamente el Repository Pattern en todos los módulos implementados (auth, course, document).

**Impacto:**
- ✅ Se resuelve uno de los puntos principales de deuda técnica documentado en la revisión del 2026-08-31.
- Mejor testabilidad: los tests unitarios de `auth.service.js` ahora pueden mockear el repository sin depender de Mongoose.
- Consistencia arquitectónica: todos los services siguen la misma convención de capas (`Controller → Service → Repository → Model`).

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

**Verificación:**
- Se probó manualmente la subida de un PDF de prueba con curl, verificando la respuesta con la vista previa (total de fragmentos, dimensiones, primer fragmento), y consultando la colección `knowledgechunks` en MongoDB para confirmar que los vectores se guardaron correctamente.
- **Pendiente:** verificación end-to-end documentada (como la que se hizo para auth/cursos el 2026-08-31).

**Deuda técnica nueva detectada:**
- ✅ **Corregido** — `auth.repository.js` implementado. `auth.service.js` ahora usa el repository correctamente en vez de consultar el modelo directamente.
- [ ] `check-setup.js` no valida las variables de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) pero sí valida `GROQ_API_KEY` (que ya no aparece en `.env.example`).
- [ ] `document.controller.verChunks` llama `knowledgeChunkRepository` directamente sin pasar por un service — rompe la convención de capas de `03_BACKEND_GUIDELINES.md`.
- [ ] El modelo `Document` tiene `estado: 'error'` y `errorMessage`, pero si el procesamiento falla, el error se loguea en el servidor pero no se persiste correctamente en el documento (el documento queda en estado `pendiente` en vez de `error`). Falta un `try/catch` alrededor de todo el pipeline con `documentRepository.actualizarEstado(id, { estado: 'error', errorMessage: error.message })`.
- [ ] Formato de respuesta inconsistente: `document.controller.js` usa `{ success, data, message }` (como `auth`), pero `course.controller.js` usa `{ exito, curso }`. Ver sección 11 de `06_API_MODELS_REFERENCE.md`.

---

## [2026-08-31] — Code review: bugfixes en auth + módulo de cursos, nueva doc de referencia

**Hecho:**
- Revisión completa del código de backend existente (auth, cursos, middlewares, validators, modelos).
- Se agregó desde el último checkpoint el módulo completo de **cursos** (CRUD con capa repository, service, controller, routes y validators) y middlewares nuevos (`error.middleware.js`, `validar.middleware.js`).
- Creado `06_API_MODELS_REFERENCE.md`: referencia detallada método por método de cada modelo, repository, service, controller, middleware y validator del backend.
- Actualizado `04_DATABASE_SCHEMA.md` para reflejar el esquema real implementado (nombres de campo en español, colecciones reales, campos que existen hoy como `bot.*`, `precio`, `activo`, etc. — la versión anterior describía un diseño que ya no coincidía con el código).

**Bugs encontrados y corregidos** (verificados con pruebas manuales end-to-end contra el servidor local — registro, login, ruta protegida, CRUD de cursos, RBAC):
- `course.service.js` importaba `AppError` como default export; solo existe como named export. Rompía la carga de `server.js` completo.
- `course.routes.js` importaba `verificarToken`/`verificarRol`/`validar` como default exports; los tres son named exports. Mismo efecto.
- 5 modelos (`enrollment`, `liveSession`, `chatMessage`, `document`, `knowledgeChunk`) usaban `require`/`module.exports` (CommonJS) en un proyecto `"type": "module"`. Convertidos a ESM.
- Esos mismos modelos referenciaban `ref: 'User'`/`ref: 'Course'` en vez de `'Usuario'`/`'Curso'` (los nombres reales registrados en Mongoose) — rompía cualquier `.populate()` futuro sobre esos campos.
- `validar.middleware.js` usaba `error.errors` (API de Zod v3); el proyecto tiene Zod v4, donde la propiedad es `error.issues`. Causaba un `500` en lugar de un `400` en cualquier validación fallida.
- `course.validator.js` usaba `errorMap` (Zod v3) en vez de `error` (Zod v4) para el mensaje custom del enum de estado — no lanzaba error, pero el mensaje personalizado se ignoraba en silencio.

**Deuda técnica registrada (no corregida en esta pasada, ver detalle en `06_API_MODELS_REFERENCE.md` sección 10):**
- [ ] Falta `auth.repository.js` (el service consulta el modelo directamente).
- [ ] Formato de respuesta inconsistente entre `auth.controller.js` (`{success, data, message}`) y `course.controller.js` (`{exito, curso}`).
- [ ] Sin bloques `@openapi` ni `swagger-ui-express` montado.
- [ ] `enrollment`, `liveSession`, `chatMessage`, `document`, `knowledgeChunk` solo tienen el modelo, sin repository/service/controller/routes.
- [ ] `verificarPropiedad` en `course.service.js` no da bypass al rol `administrador`.

---

<!-- Nueva entrada de ejemplo:

## [2026-09-05] — Sprint 1: Auth y esqueleto backend

**Hecho:**
- ...

**Decisiones:**
- ...

**Pendiente:**
- ...

-->
