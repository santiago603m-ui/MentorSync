# 🧭 MentorSync AI — Contexto Maestro del Proyecto

> **Este archivo es la fuente de verdad del proyecto.**
> Cualquier IA (Claude Code, Copilot, Cursor, etc.) o desarrollador que trabaje en este repo
> DEBE leer este archivo antes de generar código. Si algo en el código contradice este
> documento, el documento manda — se corrige el código, no al revés.
>
> Regla para agentes de IA: **no inventes tecnologías, endpoints, roles ni convenciones
> que no estén documentadas aquí.** Si falta información para tomar una decisión, pregunta
> antes de asumir.

## 1. Qué es MentorSync AI

Plataforma web de mentoría híbrida (estilo Platzi, pero diferenciada) donde:

- Los mentores dictan **cursos en vivo** (sesiones sincrónicas).
- Cada curso tiene un **asistente de IA (bot)** entrenado por el propio mentor, que responde
  preguntas de los aprendices cuando el mentor no está presente.
- El bot se entrena subiendo un **PDF con el contenido del curso** (proceso RAG: el PDF se
  trocea, se convierte en embeddings y se guarda en MongoDB Atlas Vector Search) y opcionalmente
  generando **estructura de módulos/lecciones** vía Groq (`contenidoTextoPlano` → `modulos[]`).
- El diferenciador frente a Platzi/Udemy no es el catálogo de cursos, es la **continuidad de
  mentoría** aun sin el mentor conectado.

## 2. Roles del sistema

| Rol | Estado | Permisos previstos |
|---|---|---|
| **Aprendiz** | Implementado | Inscribirse a cursos (`POST /:id/inscribir`), cancelar inscripción, chatear con el bot (`POST /:cursoId/chat`), ver historial |
| **Mentor** | Implementado | Crear cursos, subir PDF y generar estructura (`POST /:id/generar-estructura`), dictar, ver `mis-cursos`, listar documentos/chunks |
| **Administrador** | Implementado | Control total: CRUD usuarios (`/api/usuarios`), aprobar roles/estados, `GET /api/cursos/admin/todos`, crear cursos asignados a mentor, bypass de propiedad en cursos |

> Los 3 roles están implementados tanto en backend (RBAC con `verificarRol` + `verificarPropiedad(curso, mentorId, rol)`) como en frontend (`roleGuard` con `data.roles` y `AuthService.rutaSegunRol`).

## 3. Stack tecnológico (fijo — no cambiar sin actualizar este doc)

- **Frontend:** Angular 22 standalone + SSR (signal-first) + diseño **glassmorphism** (ver `02_FRONTEND_GUIDELINES.md`) + Vanta.js (three) + GSAP/anime.js + `marked`+`dompurify` para render de bot + Font Awesome 6.5.2 (CDN) — **✅ implementado** (`home`, `auth` unificada, `courses`, `learner-dashboard`, `mentor-dashboard`, `admin-panel` + `sidebar` Atlas + `theme.service`)
- **Backend:** Node.js 24.20 + Express 4.21.x + Mongoose 8.9
- **Base de datos:** MongoDB Atlas (incluye **Atlas Vector Search** para el RAG — no Pinecone/Weaviate)
- **Almacenamiento de archivos:** Cloudinary (PDFs `resource_type: 'raw'`, carpeta `mentorsync/documentos`) + `sharp` para imágenes — **✅ implementado**
- **IA generativa:** Groq API (`llama-3.3-70b-versatile`) — **✅ implementado** en `groq.provider.js` y en generación de estructura de cursos (`course.service.generarEstructuraCurso`)
- **Embeddings:** `@xenova/transformers` local (`Xenova/all-MiniLM-L6-v2`, 384D, CPU) — **✅ implementado** (`embedding.service.js`)
- **Tiempo real:** Socket.io instalado (`socket.io@4.8.3`) — **pendiente** (`src/sockets/` vacío, chat bot funciona vía HTTP)
- **Seguridad backend:** `helmet`, `express-mongo-sanitize`, `express-rate-limit` (300/15min), `compression`, `cors`, `validator`
- **Logs:** `pino` + `pino-http` (JSON, `pino-pretty` en dev) — **✅ implementado**
- **Documentación de API:** `swagger-jsdoc` + `swagger-ui-express` — **instalados pero no montados** (`// TODO` en `server.js`)
- **Testing frontend:** Vitest (no Karma/Jasmine) — configurado pero sin suites
- **Testing backend:** Jest + Supertest + `mongodb-memory-server` — configurado (`npm test`)
- **Despliegue:** Frontend Vercel/Netlify · Backend Render/Railway · DB Atlas

## 4. Documentos relacionados

- `01_ARCHITECTURE.md` → patrones, estructura de carpetas, flujo RAG
- `02_FRONTEND_GUIDELINES.md` → tokens glassmorphism, tema oscuro fijo, componentes
- `03_BACKEND_GUIDELINES.md` → convenciones ESM, AppError, formato respuesta, RBAC
- `04_DATABASE_SCHEMA.md` → colecciones + índice vectorial + modelo `Curso` con `inscritos`/`modulos`
- `05_PROGRESS.md` → bitácora (actualizar cada sprint)
- `06_API_MODELS_REFERENCE.md` → referencia método por método (incluye módulo `/api/usuarios`)

## 5. Reglas para agentes de IA que trabajen en este repo

1. Nunca reemplaces MongoDB Atlas Vector Search, Groq ni @xenova/transformers sin documentarlo aquí primero.
2. El bot de cada curso SOLO responde con contexto del `courseId` correspondiente — `filter: { courseId }` obligatorio en `$vectorSearch`.
3. Sigue la paleta y variables CSS de `02_FRONTEND_GUIDELINES.md` y `src/styles.css` (`--glass-*`, `--bg-base`, tema oscuro fijo); no agregues Bootstrap/Material sin documentarlo.
4. Sigue capas `Controller → Service → Repository → Model`; no metas lógica en controllers ni importes modelos directos en services (usa siempre `*Repository`).
5. Antes de crear un endpoint, revisa si ya existe (ver `06_API_MODELS_REFERENCE.md` §9 y `server.js`).
6. Actualiza `05_PROGRESS.md` al terminar funcionalidad relevante.
7. **Toda respuesta del bot renderizada pasa por `marked` → `DOMPurify.sanitize()` antes de `[innerHTML]`.** Nunca insertes HTML crudo del modelo.
8. Logs con `pino`/`pino-http` (`req.log`), no `console.log`/`morgan`.
9. Entry point es `src/server.js` (no `app.js`). Verifica env con `npm run check-setup` (valida `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`; pendientes Cloudinary).
10. Backend es **ESM** (`"type": "module"`) — siempre `import ... from '...js'` con extensión `.js`.
11. Services lanzan `AppError(message, statusCode)` nunca `Error` genérico.
12. Roles en BD son `aprendiz|mentor|administrador` (minúsculas español). El frontend usa capitalizados en `roleGuard` (`Aprendiz|Mentor|Administrador`).
