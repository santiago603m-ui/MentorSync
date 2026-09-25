# 🏗️ Arquitectura — MentorSync AI

## Visión general

```
Angular (Cliente)  →  Express API + Socket.io (reuniones en vivo)  →  MongoDB Atlas (+ Vector Search)
                              ↓                                    ↕
                     Servicio RAG → Groq API (generación + estructura) + @xenova/transformers (embeddings)
                              ↓
                     LiveSession + ChatMessage (socket rooms sesion:${id})
```

Arquitectura por capas + modular por dominio (feature-based), tanto en backend como frontend.

## Patrones de diseño aplicados

| Patrón | Dónde | Por qué |
|---|---|---|
| **MVC + capa de servicios** | Backend | `Controller` solo HTTP; `Service` con lógica; nunca lógica en controller |
| **Repository Pattern** | `repositories/` (auth, course, document, knowledgeChunk, chatMessage, **user**) | Aísla Mongoose, facilita testing |
| **Strategy Pattern** | `services/ai/providers/` | `IAssistantProvider` con `generarRespuesta()`; `GroqProvider` desacoplado, también usado para `generarEstructuraCurso` |
| **Factory Pattern** | Creación de contexto de bot por mentor | Cada mentor tiene su propia configuración de asistente |
| **Observer / Event-driven** | Socket.io (`sockets/index.js`) | Eventos: `sala:unirse`, `sala:mensaje` → `sala:mensaje_nuevo` (persistido en ChatMessage con `liveSessionId`), `sala:escribiendo`, `sala:abandonar` / `sala:usuario_unido|salio`, `mentor_desconectado`, `bot_activado` |
| **Middleware chain (RBAC)** | `middlewares/role.middleware.js` + `verificarPropiedad(curso, mentorId, rol)` | Control por rol + bypass `administrador` en cursos |
| **Feature Modules** | Frontend `features/` | Cada dominio es standalone y lazy-loaded vía `app.routes.ts` + `roleGuard` |

## Estructura de carpetas — Backend

```
backend/
├── src/
│   ├── config/              # database.js, cloudinary.js
│   ├── models/               # Usuario, Curso (con inscritos/modulos/contenidoTextoPlano), Document, KnowledgeChunk, ChatMessage, Enrollment, LiveSession
│   ├── controllers/          # auth, course (con inscribir/cancelar/generarEstructura), document, chat, user (admin)
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── course.service.js    # CRUD + inscribirAprendiz/cancelarInscripcion + generarEstructuraCurso (Groq JSON) + verificarPropiedad con rol
│   │   ├── document.service.js  # pipeline PDF síncrono: upload → pdf-parse → textChunker → embeddings → Cloudinary
│   │   ├── embedding.service.js # @xenova/transformers (Xenova/all-MiniLM-L6-v2, LOCAL, 384D)
│   │   ├── chat.service.js      # threadId (UUID), curso publicado requerido
│   │   ├── user.service.js      # listarUsuarios (filtros paginados), resumenRoles (aggregate), crearUsuario, cambiarRol/Estado (anti auto-cambio)
│   │   └── ai/
│   │       ├── rag.service.js
│   │       └── providers/ (assistant-provider.interface.js, groq.provider.js)
│   ├── repositories/         # auth, course (listarTodos, inscribirAprendiz, cancelarInscripcion), document, knowledgeChunk (buscarSimilares), chatMessage (crear, listarPorThread/Curso/Sesion), user (listar, contarPorRol), liveSession
│   ├── middlewares/         # auth.middleware.js, role.middleware.js, validar.middleware.js (Zod v4: error.issues), error.middleware.js
│   ├── routes/               # auth.routes.js, course.routes.js (/admin/todos, /:id/generar-estructura, /:id/inscribir, /:id/inscritos/:inscritoId), user.routes.js (/api/usuarios), liveSession.routes.js (/api/sesiones), document.routes.js, chat.routes.js
│   ├── validators/            # auth, course, chat, user, liveSession (esquemaCrearSesion, esquemaCambiarEstadoSesion, esquemaMensajeSala)
│   ├── utils/                 # AppError.js (code con fallback), textChunker.js
│   ├── services/              # liveSession.service.js (crearSesion, listarPorCurso, obtenerPorId, cambiarEstado, unirse)
│   ├── controllers/           # liveSession.controller.js (crear, listarPorCurso, obtener, cambiarEstado, listarMensajes)
│   ├── sockets/               # index.js (verificarTokenSocket + configurarSockets: sala:unirse/mensaje/escribiendo/abandonar, disconnect mentor_desconectado)
│   ├── jobs/                  # (vacío — procesamiento síncrono por ahora)
│   └── server.js             # helmet, cors, compression, mongoSanitize, pinoHttp, rateLimit 300/15min, createServer + new Server (Socket.io, cors *), configurarSockets(io), monta /api/auth, /api/usuarios, /api/sesiones, /api/cursos (×3)
├── scripts/                   # check-setup.js (valida PORT/MONGODB_URI/JWT_SECRET/GROQ_API_KEY/GROQ_MODEL/CLOUDINARY_* x3), test-cloudinary.js
├── tests/                     # (vacío, pendiente)
└── BrunoApi/                  # Admin (11), Auth (6), Courses (4), Chat (4) + archivos-prueba
```

## Estructura de carpetas — Frontend (Angular 22 standalone + SSR)

```
frontend/src/app/
├── core/                 # guards/role.guard.ts (lee route.data.roles, redirige vía authService.rutaSegunRol), interceptors/auth.interceptor.ts, services/ (admin.service.ts, auth.service.ts, curso.service.ts, historial.service.ts)
├── shared/                # components (sidebar Atlas 56+280px auto-hide, vanta-background, glass-card, button, input, logo, splash-screen) + pipes/filter.pipe.ts + services/theme.service.ts (tema oscuro fijo) + directives
├── features/
│   ├── home/              # home-page (hero SVG con anime.js draw-line, spotlight GSAP, typer, marquee infinito, stats counters, timeline con IntersectionObserver, bento + tilt)
│   ├── auth/              # AuthComponent unificada (/auth, redirects /login y /registro)
│   ├── courses/           # cursos-page
│   ├── learner-dashboard/ # aprendiz-page
│   ├── mentor-dashboard/ # mentor-dashboard (standalone inline)
│   ├── admin-panel/       # admin-panel (usa AdminService + Sidebar) + admin-dashboard-quick (doughnut/círculos, barras semanales, crecimiento)
│   └── ai-assistant/      # .gitkeep (reservado)
├── models/                 # admin.models.ts (UsuarioApi/CursoApi con _id, activo, rol minusculas, estado borrador|publicado|archivado, inscritos[]), auth.model.ts, curso.model.ts
└── layouts/               # navbar (MentorSync AI pill), responsive-layout
```

## Flujo RAG (núcleo del proyecto)

**Estado:** ✅ Completo y funcional (chat) + estructura de curso vía IA | 🚧 Falta Socket.io en vivo

1. **Ingestión (✅):** `POST /api/cursos/:cursoId/documentos` (multer 15 MB, solo mentor dueño) → registro `Document` `pendiente` → subir a Cloudinary `resource_type:'raw'` → `pdf-parse` → `textChunker.fragmentarTexto(1000,200)` → `embeddingService.generarEmbedding` por chunk (Xenova/all-MiniLM-L6-v2, 384D) → `knowledgeChunkRepository.guardarLote` → `Document` `completado`.
2. **Estructura IA (✅):** `POST /api/cursos/:id/generar-estructura` (verifica propiedad + `contenidoTextoPlano` existe) → Groq `llama-3.3-70b-versatile` con `response_format:json_object` → parse JSON `{modulos:[{titulo, descripcion, orden, lecciones:[{titulo, contenido, puntosClave, orden}]}]}` → `cursoRepository.actualizar(id, {modulos, bot.entrenado:true})`.
3. **Retrieval+Generación (✅):** `POST /api/cursos/:cursoId/chat` (auth, curso `publicado` requerido) → embed pregunta → `knowledgeChunkRepository.buscarSimilares(courseId, vector, 5)` con `filter:{courseId}` obligatorio → armar prompt system+context → `groqProvider.generarRespuesta` (temp 0.3, max 1024) → guardar en `chatmessages` → `{threadId, respuesta, fragmentosUsados}`.
4. **Aislamiento por curso:** toda `$vectorSearch` filtra por `courseId`; cada curso es un store lógico dentro de `knowledgechunks`.
5. **Historial:** `threadId` UUID v4; `GET /api/cursos/chat/historial/:threadId`.

Ver `04_DATABASE_SCHEMA.md` para colecciones (incluye `inscritos` y `modulos` en `cursos`) y `06_API_MODELS_REFERENCE.md` para pipeline detallado.
