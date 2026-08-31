# 📈 Bitácora de Avance — MentorSync AI

> Actualizar esta bitácora al cerrar cada sprint o al terminar una funcionalidad relevante.
> Formato: fecha, qué se hizo, decisiones tomadas, qué sigue.

## Cómo usar este archivo

- Cada entrada nueva va arriba (orden cronológico inverso).
- Si tomaste una decisión de arquitectura nueva, regístrala aquí Y actualiza el doc correspondiente (`01_ARCHITECTURE.md`, `02_FRONTEND_GUIDELINES.md`, etc.) — este archivo es historial, los otros son la verdad vigente.

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
- [ ] Implementar auth (registro/login) con JWT y roles
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
