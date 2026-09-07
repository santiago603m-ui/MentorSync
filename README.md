# MentorSync AI

Plataforma web de mentoría híbrida con asistente de IA por curso (RAG).

## 📚 Documentación (leer en este orden)

1. [`00_PROJECT_CONTEXT.md`](00_PROJECT_CONTEXT.md) — **Empezar aquí siempre.** Contexto maestro del proyecto, reglas para IA.
2. [`01_ARCHITECTURE.md`](01_ARCHITECTURE.md) — Arquitectura, patrones de diseño, estructura de carpetas.
3. [`02_FRONTEND_GUIDELINES.md`](02_FRONTEND_GUIDELINES.md) — Sistema de diseño glassmorphism.
4. [`03_BACKEND_GUIDELINES.md`](03_BACKEND_GUIDELINES.md) — Convenciones de backend y RBAC.
5. [`04_DATABASE_SCHEMA.md`](04_DATABASE_SCHEMA.md) — Colecciones MongoDB + Vector Search.
6. [`05_PROGRESS.md`](05_PROGRESS.md) — Bitácora de avance (actualizar cada sprint).
7. [`06_API_MODELS_REFERENCE.md`](06_API_MODELS_REFERENCE.md) — Referencia técnica detallada: modelos, repositories, services, controllers, middlewares.

> ⚠️ Si vas a usar una IA (Claude Code, Cursor, Copilot...) para trabajar en este repo,
> pásale primero `00_PROJECT_CONTEXT.md` como contexto. Ese documento existe
> específicamente para evitar que la IA invente convenciones, endpoints o tecnologías
> que no están definidas en el proyecto.

## Stack

**Backend:** Node.js + Express + MongoDB Atlas + Mongoose  
**Frontend:** Angular (pendiente de implementar)  
**IA/RAG:** ✅ Groq API (Llama) + ✅ @xenova/transformers (embeddings locales) + ✅ MongoDB Atlas Vector Search  
**Storage:** Cloudinary (PDFs)  
**Realtime:** Socket.io (sesiones mentor↔aprendiz, pendiente) | El chat con el bot ya funciona (HTTP)

## Estado del proyecto

### ✅ Implementado
- Auth (registro, login, JWT, RBAC por rol: aprendiz/mentor/administrador)
- CRUD de cursos con soft delete y control de propiedad
- Pipeline de chunking y embeddings: subida de PDF → extracción de texto → fragmentación → generación de vectores (384D con `Xenova/all-MiniLM-L6-v2`) → guardado en MongoDB
- Almacenamiento de PDFs en Cloudinary
- **Búsqueda vectorial** con MongoDB Atlas `$vectorSearch` (cosine similarity, filtro obligatorio por `courseId`)
- **Chatbot RAG funcional end-to-end**: pregunta → embeddings → búsqueda semántica → generación con Groq (Llama) → guardado en historial
- Integración con Groq API (Strategy Pattern con `IAssistantProvider`)
- Middlewares: autenticación, roles, validación con Zod v4, error handler centralizado
- Logging estructurado con Pino
- Rate limiting, CORS, helmet, mongo-sanitize
- **Repository Pattern completo** en todos los módulos (auth, course, document, chat, knowledgeChunk)

### 🚧 En desarrollo / Pendiente
- Chat en vivo con Socket.io para sesiones sincrónicas mentor↔aprendiz (el chat con el bot ya funciona)
- Frontend completo en Angular
- Swagger UI (`swagger-jsdoc` y `swagger-ui-express` instalados pero no montados)

## Estructura

```
mentorsync-ai/
├── backend/              # API Express + pipeline RAG
│   ├── src/
│   │   ├── config/       # database.js, cloudinary.js
│   │   ├── controllers/  # auth, course, document
│   │   ├── middlewares/  # auth, role, validar, error
│   │   ├── models/       # Mongoose schemas (7 modelos)
│   │   ├── repositories/ # course, document, knowledgeChunk
│   │   ├── routes/       # auth, course, document
│   │   ├── services/     # auth, course, document, embedding
│   │   ├── utils/        # AppError, textChunker
│   │   ├── validators/   # Zod schemas (auth, course)
│   │   └── server.js
│   ├── scripts/          # check-setup.js, test-cloudinary.js
│   └── package.json      # ESM ("type": "module")
└── frontend/             # Angular (esqueleto de carpetas, sin implementar)
    └── src/app/
        ├── core/         # guards, interceptors, services
        ├── features/     # auth, courses, live-session, ai-assistant, admin-panel
        ├── shared/       # components, pipes, directives
        └── layouts/
```

## Desarrollo y Testing

### Testing de API con Bruno

El proyecto incluye una colección completa de **Bruno** (alternativa open-source a Postman) en `backend/BrunoApi/MentorSync-AI-API/` con:
- Todos los endpoints de Auth (registro, login, perfiles protegidos, casos de error)
- Endpoints de Courses (CRUD, documentos, chunks)
- PDFs de prueba en `archivos-prueba/`
- Ambiente local pre-configurado

Para usarla:
1. Instalar [Bruno](https://www.usebruno.com/)
2. Abrir la colección desde `backend/BrunoApi/MentorSync-AI-API/`
3. Seleccionar ambiente "Local"
4. Los endpoints ya están listos para ejecutar

### Variables de entorno

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Completar:
#   PORT=4000
#   MONGODB_URI=mongodb+srv://...
#   JWT_SECRET=
#   JWT_EXPIRES_IN=7d
#   CLOUDINARY_CLOUD_NAME=
#   CLOUDINARY_API_KEY=
#   CLOUDINARY_API_SECRET=

# Verificar configuración
npm run check-setup

# Levantar servidor
npm run dev
# → http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
ng serve
# → http://localhost:4200
```

## Endpoints disponibles

Ver [`06_API_MODELS_REFERENCE.md`](06_API_MODELS_REFERENCE.md) sección 9 para la lista completa.

**Resumen:**
- `POST /api/auth/registro` — Crear usuario (aprendiz/mentor/administrador)
- `POST /api/auth/inicio-sesion` — Login, devuelve JWT
- `GET /api/auth/perfil-protegido` — Ruta de prueba (requiere token)
- `GET /api/cursos` — Listar cursos publicados (público)
- `POST /api/cursos` — Crear curso (solo mentor)
- `GET /api/cursos/:id` — Ver curso (público)
- `PATCH /api/cursos/:id` — Actualizar curso (solo dueño)
- `DELETE /api/cursos/:id` — Borrar curso (soft delete, solo dueño)
- `POST /api/cursos/:cursoId/documentos` — Subir PDF y procesarlo (solo dueño del curso)
- `GET /api/cursos/:cursoId/documentos` — Listar documentos de un curso
- `GET /api/cursos/:cursoId/documentos/:documentoId/chunks` — Ver chunks generados (debugging)
- `POST /api/cursos/:cursoId/chat` — Enviar pregunta al bot del curso (requiere autenticación, devuelve `threadId` + respuesta + fragmentos usados)
- `GET /api/cursos/chat/historial/:threadId` — Obtener historial de un hilo de conversación

## Decisiones técnicas clave

- **ESM puro** (`"type": "module"` en `package.json`) — no CommonJS.
- **Embeddings locales** con `@xenova/transformers` — sin costo por request, sin latencia de red. Tradeoff: CPU-bound (~50-200ms por embedding).
- **Procesamiento síncrono de PDFs** (dentro del request de subida) — suficientemente rápido para PDFs pequeños (<5 MB). Si se suben PDFs grandes (>10 MB), extraer a job asíncrono con Bull/BullMQ.
- **Cloudinary** para PDFs en vez de filesystem local o S3 directo — simplicidad, CDN incluido, free tier de 10 GB.
- **Zod v4** para validación (no v3) — API cambió: `error.issues` en vez de `error.errors`, opción `error` en vez de `errorMap`.
- **Repository Pattern** estricto — los services nunca importan modelos directamente. ✅ Todos los módulos (auth, course, document) ya tienen su repository.

## Contribuir / Desarrollo

1. Leer `00_PROJECT_CONTEXT.md` primero (siempre).
2. Seguir convenciones de `03_BACKEND_GUIDELINES.md` (ESM, AppError, Repository Pattern, formato de respuesta).
3. Actualizar `05_PROGRESS.md` tras cada cambio significativo.
4. Actualizar `06_API_MODELS_REFERENCE.md` si se agregan modelos/métodos/endpoints.
5. Commits en español, mensajes descriptivos (`git commit -m "Se implementa pipeline de chunking y embeddings"`).

## Licencia

ISC
