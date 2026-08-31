# MentorSync AI

Plataforma web de mentoría híbrida con asistente de IA por curso (RAG).

## 📚 Documentación (leer en este orden)

1. [`docs/00_PROJECT_CONTEXT.md`](./docs/00_PROJECT_CONTEXT.md) — **Empezar aquí siempre.** Contexto maestro del proyecto, reglas para IA.
2. [`docs/01_ARCHITECTURE.md`](./docs/01_ARCHITECTURE.md) — Arquitectura, patrones de diseño, estructura de carpetas.
3. [`docs/02_FRONTEND_GUIDELINES.md`](./docs/02_FRONTEND_GUIDELINES.md) — Sistema de diseño glassmorphism.
4. [`docs/03_BACKEND_GUIDELINES.md`](./docs/03_BACKEND_GUIDELINES.md) — Convenciones de backend y RBAC.
5. [`docs/04_DATABASE_SCHEMA.md`](./docs/04_DATABASE_SCHEMA.md) — Colecciones MongoDB + Vector Search.
6. [`docs/05_PROGRESS.md`](./docs/05_PROGRESS.md) — Bitácora de avance (actualizar cada sprint).

> ⚠️ Si vas a usar una IA (Claude Code, Cursor, Copilot...) para trabajar en este repo,
> pásale primero `docs/00_PROJECT_CONTEXT.md` como contexto. Ese documento existe
> específicamente para evitar que la IA invente convenciones, endpoints o tecnologías
> que no están definidas en el proyecto.

## Stack

MEAN (MongoDB Atlas + Express + Angular + Node.js) · Google Gemini API · MongoDB Atlas Vector Search · Socket.io

## Estructura

```
mentorsync-ai/
├── backend/       # API Express
└── frontend/      # Angular
1. [`00_PROJECT_CONTEXT.md`] **Empezar aquí siempre.** Contexto maestro del proyecto, reglas para IA.
2. [`01_ARCHITECTURE.md`] — Arquitectura, patrones de diseño, estructura de carpetas.
3. [`02_FRONTEND_GUIDELINES.md`] — Sistema de diseño glassmorphism.
4. [`03_BACKEND_GUIDELINES.md`] — Convenciones de backend y RBAC.
5. [`04_DATABASE_SCHEMA.md`] — Colecciones MongoDB + Vector Search.
6. [`05_PROGRESS.md`] — Bitácora de avance (actualizar cada sprint).
```

## Setup rápido (a completar cuando arranques el código)

```bash
# Backend
cd backend
npm install
cp .env.example .env   # completar variables
npm run dev

# Frontend
cd frontend
npm install
ng serve
```
