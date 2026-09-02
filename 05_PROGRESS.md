# 📈 Bitácora de Avance — MentorSync AI

> Actualizar esta bitácora al cerrar cada sprint o al terminar una funcionalidad relevante.
> Formato: fecha, qué se hizo, decisiones tomadas, qué sigue.

## Cómo usar este archivo

- Cada entrada nueva va arriba (orden cronológico inverso).
- Si tomaste una decisión de arquitectura nueva, regístrala aquí Y actualiza el doc correspondiente (`01_ARCHITECTURE.md`, `02_FRONTEND_GUIDELINES.md`, etc.) — este archivo es historial, los otros son la verdad vigente.

---

## [2026-08-31] — Auth: registro y login

**Hecho:**
- Implementado `auth.service.js` con `register()` y `login()`: hash de contraseña con `bcryptjs`, generación de JWT con `jsonwebtoken` (payload `{ id, rol, email }`, expiración configurable vía `JWT_EXPIRES_IN`, default `7d`).
- Implementado `auth.controller.js` (`register`, `login`) y `auth.routes.js` con `POST /api/auth/register` y `POST /api/auth/login` como rutas públicas.
- Implementado `auth.middleware.js` (`VerificarToken`) para validar el JWT del header `Authorization: Bearer <token>`.
- Implementado `role.middleware.js` (`verificarRol`) para RBAC por rol (`aprendiz`, `mentor`, `administrador`).
- Añadida ruta de prueba protegida `GET /api/auth/perfil-protegido` para verificar el flujo `VerificarToken → verificarRol` end-to-end.
- Montadas las rutas de auth en `server.js` bajo `/api/auth`.

**Decisiones:**
- `register()`/`login()` aceptan tanto `password` como `contraseña` como nombre de campo (fallback), para tolerar clientes que envíen cualquiera de los dos.
- El login solo permite usuarios con `isActive: true` (borrado lógico respetado desde el primer momento).

**Pendiente / deuda técnica (no sigue aún 100% `03_BACKEND_GUIDELINES.md`):**
- [ ] `auth.service.js` consulta `User` (Mongoose) directamente — falta extraer un `auth.repository.js` para respetar el Repository Pattern documentado en `01_ARCHITECTURE.md`.
- [ ] Los errores se manejan con `try/catch` + `res.json` directo en el controller, no con `next(error)` + `error.middleware.js` centralizado (ese middleware todavía no existe).
- [ ] Falta documentación `@openapi` (swagger-jsdoc) en `auth.routes.js`.
- [ ] Falta capa de validación (Joi/Zod) antes de llegar al service (`validators/`).
- [ ] Falta implementar auth en el frontend (`features/auth/`, `guards/auth.guard.ts`, interceptor de JWT).

---

## [2026-08-31] — Modelos de Mongoose

**Hecho:**
- Creados los 7 schemas de Mongoose en `backend/src/models/`: `user.model.js`, `course.model.js`, `enrollment.model.js`, `document.model.js`, `knowledgeChunk.model.js`, `chatMessage.model.js`, `liveSession.model.js`.
- Verificado que todos cargan sin errores (`node -e "require(...)"` sobre cada archivo).

**Decisiones:**
- Se introduce la colección `enrollments` para desacoplar la relación aprendiz↔curso de `users` (reemplaza el array `cursosInscritos` planteado originalmente en `04_DATABASE_SCHEMA.md`), con índice único `{ userId, courseId }` y campo `progreso`.
- Se introduce la colección `documents` para rastrear el estado de procesamiento (chunking/embeddings) de cada PDF subido, antes de que sus fragmentos lleguen a `knowledgeChunks`.
- `knowledgeChunks` ahora referencia `documentId` además de `courseId`.
- `chatMessages` y `liveSessions` se ampliaron con más campos (`threadId`, `liveSessionId`, `remitenteId`, `rolRemitente`, `estado`, fechas de sesión, `urlReunion`) respecto al esquema simplificado que había en `04_DATABASE_SCHEMA.md`.
- Actualizado `04_DATABASE_SCHEMA.md` y `01_ARCHITECTURE.md` para reflejar el diseño final de colecciones.

**Pendiente:**
- [ ] Crear el índice de Vector Search en MongoDB Atlas para `knowledgeChunks.embedding`.
- [ ] Repositories que encapsulen las queries de estos modelos.

---

## [Sin iniciar] — Setup inicial

**Hecho:**
- Definida arquitectura general (MEAN + RAG con Groq + MongoDB Atlas Vector Search)
- Definidos 3 roles: aprendiz, mentor, administrador
- Definida estructura de carpetas backend y frontend
- Definido sistema de diseño glassmorphism para frontend

**Pendiente / próximos pasos:**
- [ ] Configurar cluster de MongoDB Atlas + índice de Vector Search
- [ ] Setup inicial de Express (esqueleto de carpetas, conexión DB)
- [ ] Setup inicial de Angular (esqueleto de módulos por feature)
- [x] Implementar auth (registro/login) con JWT y roles — ver entrada `[2026-08-31] — Auth: registro y login`
- [ ] Endpoint de subida de PDF + job de chunking/embeddings
- [ ] Servicio RAG (`rag.service.js`) con integración Groq + @xenova/transformers
- [ ] Chat en vivo con Socket.io
- [ ] UI base con componentes glass (`glass-card`, `glass-navbar`, etc.)

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
