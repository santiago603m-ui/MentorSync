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
│   ├── config/              # conexión DB, variables de entorno, config Groq
│   ├── models/               # Mongoose schemas (User, Course, KnowledgeChunk, ChatMessage, LiveSession)
│   ├── controllers/          # solo reciben req/res, delegan a services
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── course.service.js
│   │   ├── chat.service.js
│   │   └── ai/
│   │       ├── rag.service.js         # orquesta embedding + retrieval + generación
│   │       ├── embedding.service.js   # convierte PDF → vectores (usa @xenova/transformers, LOCAL, no llama a Groq)
│   │       └── providers/
│   │           └── groq.provider.js
│   ├── repositories/         # acceso a datos (Mongoose queries encapsuladas)
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   ├── routes/                # una carpeta/archivo por dominio
│   ├── docs/                  # swagger-jsdoc (definiciones OpenAPI)
│   ├── sockets/                # lógica de websockets separada de HTTP
│   ├── validators/            # Joi/Zod
│   ├── utils/
│   └── jobs/                  # procesamiento async del PDF (cola de embeddings)
├── tests/
└── server.js
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

1. Mentor sube PDF → job asíncrono trocea el texto (chunking) → genera embeddings localmente con @xenova/transformers → guarda vectores en `knowledgeChunks` (MongoDB Atlas Vector Search), indexados por `courseId`.
2. Aprendiz pregunta → se embebe la pregunta → `$vectorSearch` filtrado por `courseId` trae los chunks más relevantes → se arma el prompt con contexto + pregunta → Groq (Llama) genera la respuesta.
3. Aislar el vector store por curso evita que el bot de un mentor "alucine" con contenido de otro curso.

Ver `04_DATABASE_SCHEMA.md` para el detalle de colecciones e índice.
