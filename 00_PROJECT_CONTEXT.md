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
  trocea, se convierte en embeddings y se guarda en MongoDB Atlas Vector Search).
- El diferenciador frente a Platzi/Udemy no es el catálogo de cursos, es la **continuidad de
  mentoría** aun sin el mentor conectado.

## 2. Roles del sistema

| Rol | Estado | Permisos previstos |
|---|---|---|
| **Aprendiz** | Definido | Inscribirse a cursos, chatear en vivo con el mentor, interactuar con el bot del curso |
| **Mentor** | Definido | Crear cursos, subir PDF de entrenamiento, dictar sesiones en vivo, ver analítica de preguntas del bot |
| **Administrador** | Definido | Control total: aprobar mentores, moderar contenido, ver métricas globales |

> Decisión tomada: se implementan **los 3 roles desde el diseño**, aunque el MVP puede
> lanzar con funcionalidad mínima del rol administrador.

## 3. Stack tecnológico (fijo — no cambiar sin actualizar este doc)

- **Frontend:** Angular 22 (signal-first) + diseño **glassmorphism** (ver `02_FRONTEND_GUIDELINES.md`)
- **Backend:** Node.js 24.19 + Express 4.21.x
- **Base de datos:** MongoDB Atlas (incluye **Atlas Vector Search** para el RAG — no se usa
  Pinecone, Weaviate ni otro vector store externo)
- **IA generativa (chat/respuestas del bot):** Groq API (modelos open-weight tipo Llama, gratis y muy rápido)
- **Embeddings (para RAG):** `@xenova/transformers` corriendo local en Node (modelo tipo `all-MiniLM-L6-v2`) — Groq NO tiene endpoint de embeddings, por eso se separan ambas piezas
- **Tiempo real:** Socket.io (chat en vivo, notificaciones de sesión)
- **Seguridad backend:** `helmet`, `express-mongo-sanitize`, `express-rate-limit`, `compression`
- **Logs:** `pino` + `pino-http` (logs estructurados en JSON, no `morgan`/`console.log`)
- **Documentación de API:** `swagger-jsdoc` + `swagger-ui-express`, servida en `/api-docs`
- **Renderizado de markdown del bot (frontend):** `marked` para parsear + `dompurify` para sanitizar SIEMPRE antes de insertar HTML — ver regla 7 abajo
- **Testing frontend:** Vitest (no Karma/Jasmine)
- **Testing backend:** Jest + Supertest + `mongodb-memory-server`
- **Gestión del proyecto:** Scrum + Notion (backlog)
- **Despliegue:** Frontend en Vercel/Netlify · Backend en Render/Railway · DB en MongoDB Atlas

## 4. Documentos relacionados

- `01_ARCHITECTURE.md` → patrones de diseño, estructura de carpetas explicada, flujo RAG
- `02_FRONTEND_GUIDELINES.md` → sistema de diseño glassmorphism (colores, blur, componentes)
- `03_BACKEND_GUIDELINES.md` → convenciones de código, formato de respuestas API, manejo de errores
- `04_DATABASE_SCHEMA.md` → colecciones de MongoDB e índice de Vector Search
- `05_PROGRESS.md` → bitácora de avance del proyecto (actualizar en cada sprint)

## 5. Reglas para agentes de IA que trabajen en este repo

1. Nunca reemplaces MongoDB Atlas Vector Search, Groq (generación) ni @xenova/transformers (embeddings) por otra solución sin documentarlo aquí primero.
2. El bot de cada curso SOLO debe responder con contexto del `courseId` correspondiente — nunca mezclar contenido entre cursos.
3. Sigue la paleta y variables CSS definidas en `02_FRONTEND_GUIDELINES.md`; no introduzcas librerías de UI nuevas (Bootstrap, Material) sin documentarlo aquí.
4. Sigue la estructura de capas del backend (`Controller → Service → Repository → Model`); no metas lógica de negocio en los controladores.
5. Antes de crear un nuevo endpoint, revisa si ya existe algo similar documentado.
6. Actualiza `05_PROGRESS.md` al terminar una funcionalidad relevante.
7. **Toda respuesta del bot que se renderice en el frontend pasa primero por `marked` y LUEGO por `DOMPurify.sanitize()` antes de insertarse en el DOM.** Nunca usar `[innerHTML]` con la salida cruda de `marked` sin sanitizar — el contenido viene de un modelo de IA y no es confiable por defecto.
8. Los logs del backend se hacen con `pino`/`pino-http`, no con `console.log` ni `morgan`.
9. El entry point del backend es `src/server.js` (no `app.js`). Correr `npm run check-setup` verifica que las variables de entorno mínimas existan antes de levantar el servidor.
