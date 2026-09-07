# 🏗️ Arquitectura — MentorSync AI

## Visión general

```
Angular (Cliente)  →  Express API + Socket.io  →  MongoDB Atlas (+ Vector Search)
                              ↓
                     Servicio RAG → Groq API (generación) + @xenova/transformers (embeddings)
```

Arquitectura por capas + modular por dominio (feature-based), tanto en backend como frontend.

## Patrones de diseño aplicados

| Patrón | Dónde | Por qué |
|---|---|---|
| **MVC + capa de servicios** | Backend | `Controller` solo recibe/responde HTTP; `Service` tiene la lógica; nunca lógica de negocio en el controller |
| **Repository Pattern** | Backend (`repositories/`) | Aísla Mongoose del resto del código; facilita testing y cambios futuros |
| **Strategy Pattern** | `services/ai/providers/` | Interfaz `IAssistantProvider` con `generateResponse()` y `embedDocument()`; hoy implementa `GroqProvider`, pero queda desacoplado |
| **Factory Pattern** | Creación de contexto de bot por mentor | Cada mentor tiene su propia configuración/contexto de asistente |
| **Observer / Event-driven** | Socket.io | Eventos: `mensaje_enviado`, `mentor_desconectado`, `bot_activado` |
| **Middleware chain (RBAC)** | `middlewares/role.middleware.js` | Control de acceso por rol (aprendiz/mentor/administrador) |
| **Feature Modules** | Frontend (`features/`) | Cada dominio (cursos, chat, admin) es independiente y lazy-loaded |

## Estructura de carpetas — Backend

```
backend/
├── src/
│   ├── config/              # database.js, cloudinary.js, variables de entorno
│   ├── models/               # Mongoose schemas (Usuario, Curso, Document, KnowledgeChunk, ChatMessage, LiveSession, Enrollment)
│   ├── controllers/          # solo reciben req/res, delegan a services (auth, course, document, chat)
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── course.service.js
│   │   ├── document.service.js    # pipeline PDF: upload → extracción texto → chunking → embeddings
│   │   ├── chat.service.js         # lógica de conversación con el bot (threadId, guardado de mensajes)
│   │   ├── embedding.service.js   # @xenova/transformers (Xenova/all-MiniLM-L6-v2, LOCAL, 384D)
│   │   └── ai/
│   │       ├── rag.service.js         # orquesta retrieval ($vectorSearch) + generación (Groq)
│   │       └── providers/
│   │           ├── assistant-provider.interface.js  # Strategy Pattern (clase abstracta)
│   │           └── groq.provider.js                 # implementación con SDK de Groq
│   ├── repositories/         # acceso a datos (auth, course, document, knowledgeChunk, chatMessage)
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validar.middleware.js
│   │   └── error.middleware.js
│   ├── routes/                # auth.routes.js, course.routes.js, document.routes.js, chat.routes.js
│   ├── validators/            # Zod v4 (auth, course, chat)
│   ├── utils/                 # AppError.js, textChunker.js
│   ├── sockets/               # (vacío, pendiente)
│   ├── jobs/                  # (vacío, pendiente — procesamiento síncrono por ahora)
│   └── server.js
├── scripts/                   # check-setup.js, test-cloudinary.js
├── tests/                     # (vacío, pendiente)
└── BrunoApi/                  # colección de testing con todos los endpoints (Auth, Courses, Chat)
```

## Estructura de carpetas — Frontend (Angular)

```
frontend/src/app/
├── core/                 # servicios singleton, guards, interceptors
│   ├── guards/            # role.guard.ts, auth.guard.ts
│   ├── interceptors/      # inyecta JWT automáticamente
│   └── services/
├── shared/                # componentes/pipes/directivas reutilizables (glass-card, glass-button...)
├── features/
│   ├── auth/
│   ├── courses/
│   ├── live-session/       # chat en vivo con mentor
│   ├── ai-assistant/       # UI del bot
│   ├── mentor-dashboard/   # subir PDF, gestionar curso
│   └── admin-panel/
├── models/                 # interfaces TS compartidas
└── layouts/
```

## Flujo RAG (núcleo del proyecto)

**Estado actual:** ✅ Completo y funcional | 🚧 Falta solo el frontend (Angular)

1. **Ingestión (✅ implementado):** Mentor sube PDF vía `POST /api/cursos/:cursoId/documentos` → se procesa **síncronamente** dentro del mismo request: extracción de texto con `pdf-parse` → fragmentación con `textChunker.js` (chunks de 1000 caracteres, overlap de 200) → generación de embeddings localmente con `@xenova/transformers` (modelo `Xenova/all-MiniLM-L6-v2`, vectores de 384 dimensiones, CPU puro, sin GPU ni API externa) → guardado en lote en colección `knowledgechunks` de MongoDB, indexados por `courseId` → documento se marca como `completado` con la URL de Cloudinary.

2. **Retrieval + Generación (✅ implementado):** Aprendiz pregunta vía `POST /api/cursos/:cursoId/chat` → se embebe la pregunta con el mismo modelo → `$vectorSearch` de MongoDB Atlas filtrado por `courseId` trae los 5 chunks más relevantes (cosine similarity, `numCandidates = limite * 20`) → se arma el prompt con contexto + pregunta + instrucciones (responder solo con base en contexto, no inventar, markdown cuando ayude) → Groq (Llama) genera la respuesta (temperatura 0.3, max 1024 tokens) → se guarda en `chatmessages` para historial → devuelve `{ threadId, respuesta, fragmentosUsados }` (con `score` y vista previa de cada fragmento).

3. **Aislamiento por curso:** El filtro obligatorio `{ courseId }` en toda query `$vectorSearch` evita que el bot de un curso "alucine" con contenido de otro curso — cada curso tiene su propio vector store lógico dentro de la misma colección física.

4. **Historial de conversación:** Cada hilo tiene un `threadId` (UUID v4). El aprendiz puede continuar una conversación enviando el mismo `threadId`, o crear una nueva conversación (nuevo UUID). El historial se consulta con `GET /api/cursos/chat/historial/:threadId`.

Ver `04_DATABASE_SCHEMA.md` para el detalle de colecciones e índice, y `06_API_MODELS_REFERENCE.md` para el pipeline implementado método por método.
