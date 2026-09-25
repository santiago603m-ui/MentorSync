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

**Backend:** Node.js 24.20 + Express 4.21 + MongoDB Atlas + Mongoose 8.9  
**Frontend:** Angular 22 (standalone, signal-first) + glassmorphism + Vanta.js + GSAP/anime.js  
**IA/RAG:** ✅ Groq API (Llama 3.3 70B) + ✅ @xenova/transformers (`all-MiniLM-L6-v2`, 384D, local) + ✅ MongoDB Atlas Vector Search  
**Storage:** Cloudinary (PDFs, `resource_type: 'raw'`) + sharp (imágenes)  
**Pagos:** ✅ PayU Latam Colombia Web Checkout + webhook MD5 + inscripción idempotente
**Realtime:** ✅ Socket.io para reuniones en vivo (`sockets/index.js`, `liveSession` + `ChatMessage.liveSessionId`, rooms `sesion:{id}`) + chat bot HTTP  
**Seguridad:** helmet, cors, compression, express-mongo-sanitize, express-rate-limit, validator, pino

## Estado del proyecto

### ✅ Implementado
- Auth completa (registro, login, JWT, RBAC por rol: `aprendiz`/`mentor`/`administrador`, guards e interceptores en frontend)
- CRUD de cursos con soft delete, control de propiedad y **bypass de administrador** (`verificarPropiedad(curso, mentorId, rol)`)
- Inscripciones embebidas en el modelo `Curso` (`inscritos: [{ id, nombre, correo }]`) — cursos gratuitos por endpoint directo y cursos pagos mediante PayU, con webhook firmado e inscripción idempotente
- **Pagos PayU Colombia:** checkout Web Checkout, formulario firmado, confirmación server-to-server, validación de monto/moneda, estados de retorno y bloqueo de inscripción directa para cursos de pago
- Generación de estructura tipo Platzi vía Groq (`POST /api/cursos/:id/generar-estructura`) → `modulos[] > lecciones[]` + `contenidoTextoPlano`
- Módulo admin completo: `GET /api/usuarios`, `GET /api/usuarios/resumen`, `POST /api/usuarios`, `PATCH /api/usuarios/:id/rol`, `PATCH /api/usuarios/:id/estado` (solo `administrador`, con validación de no auto-cambio de rol/estado) + `GET /api/cursos/admin/todos`
- Pipeline de chunking y embeddings: subida de PDF → extracción con `pdf-parse` → fragmentación (1000 chars, overlap 200) → embeddings 384D con `Xenova/all-MiniLM-L6-v2` → guardado en `knowledgechunks` (batch) → documento `completado` con URL Cloudinary
- **Búsqueda vectorial** con Atlas `$vectorSearch` (cosine, `numCandidates = limite*20`, filtro obligatorio por `courseId`)
- **Chatbot RAG end-to-end**: pregunta → embedding → vectorSearch (5 chunks) → prompt + Groq → guardado en `chatmessages` (`threadId` UUID)
- Frontend funcional: Home con hero SVG animado + spotlight/marque + timeline glass, Auth unificada (`/auth` con redirect `/login`/`/registro`), Cursos, dashboards por rol (`/aprendiz`, `/mentor`, `/admin` con `roleGuard`), Admin panel (KPIs, doughnut roles, barras semanales, crecimiento mensual, tabla usuarios con editar rol/estado, CRUD cursos con estados `borrador|publicado|archivado`), sidebar Atlas (rail 56px + explorer 280px, auto-hide hover, glassmorphism) + Vanta background + ThemeService (`dark`/`light` + cyberpunk)
- Reuniones en vivo: `LiveSession` (programada/en_curso/finalizada/cancelada) + `ChatMessage.liveSessionId` + Socket.io rooms `sesion:{id}` (eventos `sala:unirse/mensaje/escribiendo/abandonar`, broadcasts `sala:*`, `mentor_desconectado`, `bot_activado`)
- Repository Pattern estricto en todos los módulos (auth, course, document, knowledgeChunk, chatMessage, user, liveSession)
- Middlewares: auth, role, validar (Zod v4), error centralizado
- Logging estructurado con `pino` + `pino-http`, rate limiting, CORS, helmet, mongo-sanitize
- Colección Bruno completa: Auth (6), Courses (4), Chat (4), Admin (11) + PDFs de prueba

### 🚧 En desarrollo / Pendiente
- Swagger UI (`swagger-jsdoc` + `swagger-ui-express` instalados pero no montados en `/api-docs`)
- `enrollments` como colección separada (hoy `inscritos` embebido en `Curso`; `liveSessions` ya tiene modelo + repository/service + Socket.io implementados)

## Estructura

```
mentorsync-ai/
├── backend/              # API Express + pipeline RAG
│   ├── src/
│   │   ├── config/       # database.js, cloudinary.js
│   │   ├── controllers/  # auth, course, document, chat, user
│   │   ├── middlewares/  # auth, role, validar, error
│   │   ├── models/       # Usuario, Curso, Document, KnowledgeChunk, ChatMessage, Enrollment, LiveSession
│   │   ├── repositories/ # auth, course, document, knowledgeChunk, chatMessage, user
│   │   ├── routes/       # auth, course, document, chat, user (/api/usuarios)
│   │   ├── services/     # auth, course, document, embedding, rag, groq, chat, user
│   │   │   └── ai/providers/ # assistant-provider.interface, groq.provider
│   │   ├── utils/        # AppError, textChunker
│   │   ├── validators/   # auth, course, chat, user (Zod v4)
│   │   └── server.js     # monta /api/auth, /api/usuarios, /api/cursos (×3)
│   ├── scripts/          # check-setup.js, test-cloudinary.js
│   └── package.json      # ESM ("type": "module"), engines node >=24.20
└── frontend/             # Angular 22 standalone + SSR
    └── src/app/
        ├── core/         # guards/role.guard.ts, interceptors/auth.interceptor.ts, services (admin, auth, curso, historial)
        ├── features/     # home (hero GSAP + marquee + timeline), auth (AuthComponent unificada), courses, admin-panel (admin-dashboard-quick + admin-panel + admin.service), mentor-dashboard, learner-dashboard, ai-assistant (.gitkeep)
        ├── shared/       # components (sidebar Atlas, vanta-background, glass-card, button, input, logo, splash-screen), pipes/filter, services/theme.service.ts, directives
        ├── layouts/      # navbar, responsive-layout
        ├── models/       # admin.models, auth.model, curso.model
        └── app.routes.ts # VantaBackgroundComponent wrapper + roleGuard (roles: 'Aprendiz'/'Mentor'/'Administrador')
```

## Desarrollo y Testing

### Testing de API con Bruno

Colección en `backend/BrunoApi/MentorSync-AI-API/` con:
- Auth (registro aprendiz/mentor, login, perfil protegido, errores)
- Courses (listar, crear, subir documento, ver chunks)
- Chat (pregunta nueva/mismo hilo/historial/error curso no publicado)
- **Admin (11 casos)**: login admin, listar usuarios, resumen roles, cambiar rol/estado, errores de permiso y auto-cambio, admin todos los cursos, crear curso/usuario como admin
- PDFs de prueba en `archivos-prueba/`
- Ambiente `Local` pre-configurado (`http://localhost:4000`)

Para usarla:
1. Instalar [Bruno](https://www.usebruno.com/)
2. Abrir la colección desde `backend/BrunoApi/MentorSync-AI-API/`
3. Seleccionar ambiente "Local"
4. Ejecutar en orden (Auth → Admin → Courses → Chat)

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
#   GROQ_API_KEY=
#   GROQ_MODEL=llama-3.3-70b-versatile
#   BACKEND_URL=http://localhost:4000
#   FRONTEND_URL=http://localhost:4200
#   PAYU_ENV=test
#   PAYU_API_KEY=
#   PAYU_MERCHANT_ID=
#   PAYU_ACCOUNT_ID=
#   PAYU_CONFIRMATION_URL=

# Verificar configuración
npm run check-setup

# Levantar servidor
npm run dev
# → http://localhost:4000
```

> `scripts/check-setup.js` valida 13 variables, incluyendo las tres credenciales de PayU y las URLs pública del backend/frontend. Consulta `backend/.env.example`.

### Frontend

```bash
cd frontend
npm install
ng serve
# → http://localhost:4200
```

Stack frontend: Angular 22 + `animejs` + `gsap` + `three` + `vanta` + `marked` + `dompurify` + Font Awesome 6.5.2 (CDN) + Vitest (no Karma)

## Endpoints disponibles

Ver [`06_API_MODELS_REFERENCE.md`](06_API_MODELS_REFERENCE.md) sección 9 para la lista completa.

**Resumen:**
- `POST /api/auth/registro` — Crear usuario (aprendiz/mentor/administrador)
- `POST /api/auth/inicio-sesion` — Login, devuelve JWT
- `GET /api/auth/perfil-protegido` — Ruta de prueba (requiere token)
- `GET /api/usuarios` — Listar usuarios con filtros `rol`, `busqueda`, paginado (solo administrador)
- `GET /api/usuarios/resumen` — Conteo por rol `{ administrador, mentor, aprendiz, total }` (solo administrador)
- `POST /api/usuarios` — Crear usuario con rol arbitrario (solo administrador)
- `PATCH /api/usuarios/:id/rol` — Cambiar rol (no a sí mismo, solo administrador)
- `PATCH /api/usuarios/:id/estado` — Activar/desactivar (no a sí mismo, solo administrador)
- `GET /api/cursos` — Listar cursos publicados (público)
- `GET /api/cursos/admin/todos` — Todos los cursos activos en cualquier estado (solo administrador)
- `GET /api/cursos/mis-cursos` — Cursos del mentor autenticado (solo mentor)
- `POST /api/cursos` — Crear curso (mentor o administrador con `body.mentor` para asignar)
- `GET /api/cursos/:id` — Ver curso (público)
- `PATCH /api/cursos/:id` / `PATCH /api/cursos/:id/estado` / `DELETE /api/cursos/:id` — Actualizar/cambiar estado/borrar (dueño o administrador)
- `POST /api/cursos/:id/inscribir` — Inscribir aprendiz autenticado en curso **gratuito** (`inscritos[]` embebido); devuelve 402 si el curso es de pago
- `POST /api/pagos/checkout` — Crear intento PayU y obtener los campos firmados del Web Checkout (aprendiz)
- `GET /api/pagos/estado/:referencia` — Consultar el resultado persistido por el webhook (solo el aprendiz dueño)
- `POST /api/pagos/confirmacion` — Webhook público de PayU, protegido por merchant + firma MD5
- `DELETE /api/cursos/:id/inscritos/:inscritoId` — Cancelar inscripción (aprendiz)
- `POST /api/cursos/:id/generar-estructura` — Generar `modulos/lecciones` vía Groq JSON (solo mentor dueño)
- `POST /api/cursos/:cursoId/documentos` — Subir PDF y procesarlo (solo dueño del curso)
- `GET /api/cursos/:cursoId/documentos` — Listar documentos de un curso
- `GET /api/cursos/:cursoId/documentos/:documentoId/chunks` — Ver chunks generados (debugging)
- `POST /api/cursos/:cursoId/chat` — Enviar pregunta al bot del curso (requiere auth, curso publicado)
- `GET /api/cursos/chat/historial/:threadId` — Historial de hilo

## Decisiones técnicas clave

- **ESM puro** (`"type": "module"`) — no CommonJS.
- **Embeddings locales** con `@xenova/transformers` — sin costo por request, CPU-bound (~50-200ms por embedding).
- **Procesamiento síncrono de PDFs** dentro del request de subida — OK para PDFs <5 MB; para >10 MB extraer a Bull/BullMQ.
- **Inscritos embebidos** en `Curso` (`inscritos: [{id, nombre, correo}]`) en vez de colección `enrollments` separada — simple para MVP, índice `enrollments` permanece sin uso.
- **Pagos PayU Web Checkout** para Colombia: sin SDK; el backend firma un formulario y el frontend lo envía por POST. La confirmación server-to-server es la fuente de verdad.
- **Cloudinary** para PDFs (`resource_type: 'raw'`, carpeta `mentorsync/documentos`) — simplicidad, CDN, free tier 10 GB.
- **Zod v4** — `error.issues` y opción `error` (no `errorMap`).
- **Repository Pattern** estricto — services nunca importan modelos directos.
- **Roles en minúsculas español** en Mongo (`aprendiz|mentor|administrador`) — el `roleGuard` del frontend usa `['Aprendiz','Mentor','Administrador']` (capitalizado, vía `auth.model.ts`).
- **Tema glassmorphism** con `data-theme="light"|"dark"` + `.theme-cyberpunk` opcional vía `ThemeService` (signals `mode`/`isCyberpunk`, persiste en localStorage).

## Contribuir / Desarrollo

1. Leer `00_PROJECT_CONTEXT.md` primero (siempre).
2. Seguir convenciones de `03_BACKEND_GUIDELINES.md` (ESM, AppError, Repository Pattern, formato `{success, data, message}`).
3. Actualizar `05_PROGRESS.md` tras cada cambio significativo.
4. Actualizar `06_API_MODELS_REFERENCE.md` si se agregan modelos/métodos/endpoints.
5. Commits en español, mensajes descriptivos.

## Licencia

ISC
