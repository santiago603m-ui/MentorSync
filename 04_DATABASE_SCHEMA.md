# 🗄️ Base de Datos — MongoDB Atlas

> ⚠️ Este documento refleja el esquema **realmente implementado** en `backend/src/models/`. Para el detalle método por método de cada capa (repository/service/controller), ver `06_API_MODELS_REFERENCE.md`.

## Colecciones

### `usuarios`  (modelo `Usuario`, `user.model.js`)
```
_id
nombre, email (único), contraseñaHash   // select:false, nunca se trae por defecto
rol: "aprendiz" | "mentor" | "administrador"   // default "aprendiz"
perfilMentor: { bio, especialidad, verificado }   // default: undefined — solo existe si rol = "mentor"
activo: Boolean   // default true, borrado lógico
createdAt, updatedAt
```

> Nota: `cursosInscritos`/`cursosCreados` como arrays embebidos en el usuario (mencionados en una versión anterior de este doc) **no se implementaron**. La relación usuario↔curso se resuelve por query (`mentor` en `cursos`, y a futuro `enrollments`), no por arrays embebidos.

### `cursos`  (modelo `Curso`, `course.model.js`)
```
_id
mentor (ref → usuarios), requerido
titulo (máx 120), descripcion (máx 2000), categoria
portadaUrl: String | null
estado: "borrador" | "publicado" | "archivado"   // default "borrador"
precio: Number   // default 0, min 0
duracionEstimadaHoras: Number   // default 0, min 0
bot: {
  entrenado: Boolean,              // default false
  fechaEntrenamiento: Date | null,
  documentoOrigenNombre: String | null,
  totalChunks: Number              // default 0
}
activo: Boolean   // default true, borrado lógico
createdAt, updatedAt
```
Índices: `{ mentor: 1 }`, `{ estado: 1 }`.

### `enrollments`  (modelo `Enrollment`, `enrollment.model.js`) — sin repository/service todavía
```
_id
userId (ref → usuarios), requerido
courseId (ref → cursos), requerido
estado: "activo" | "completado" | "suspendido"   // default "activo"
progreso: Number   // default 0, porcentaje 0-100 (sin min/max validado en el schema aún)
createdAt, updatedAt
```
Índice único compuesto `{ userId: 1, courseId: 1 }` — un usuario no puede inscribirse dos veces al mismo curso.

### `knowledgechunks`  ⭐ colección clave del RAG (modelo `KnowledgeChunk`, `knowledgeChunk.model.js`) — sin repository/service todavía
```
_id
courseId (ref → cursos), requerido       // filtro OBLIGATORIO en toda query del bot
documentId (ref → documents), requerido
texto            // fragmento del documento
embedding: [Number]   // vector de 384 dimensiones con Xenova/all-MiniLM-L6-v2
metadata: { pagina, seccion }
createdAt, updatedAt
```

### `documents`  (modelo `Document`, `document.model.js`) — sin repository/service todavía
```
_id
courseId (ref → cursos), requerido
mentorId (ref → usuarios), requerido
nombreOriginal, fileUrl, requeridos
tipo: "pdf" | "txt" | "enlace"   // default "pdf"
estado: "pendiente" | "procesando" | "completado" | "error"   // default "pendiente"
errorMessage: String   // motivo del fallo si el job de procesamiento falla
createdAt, updatedAt
```

### `chatmessages`  (modelo `ChatMessage`, `chatMessage.model.js`) — sin repository/service todavía
```
_id
courseId (ref → cursos), requerido
threadId: String, indexado          // agrupa una conversación con el bot
liveSessionId (ref → LiveSession)   // null si es chat directo con el bot fuera de sesión
remitenteId (ref → usuarios)        // null si el remitente es el bot
rolRemitente: "aprendiz" | "mentor" | "bot", requerido
contenido: String, requerido
esRespuestaBot: Boolean   // default false
createdAt, updatedAt
```

### `livesessions`  (modelo `LiveSession`, `liveSession.model.js`) — sin repository/service todavía
```
_id
courseId (ref → cursos), requerido
mentorId (ref → usuarios), requerido
titulo, requerido
estado: "programada" | "en_curso" | "finalizada" | "cancelada"   // default "programada"
fechaInicioProgramada: Date, requerido
fechaInicioReal, fechaFin: Date
urlReunion: String
transcript: String   // opcional, si se logra grabar y transcribir
asistentes: [ObjectId] (ref → usuarios)
createdAt, updatedAt
```

## Índice de Vector Search (Atlas)

Definido sobre `knowledgechunks`, campo `embedding`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "courseId" }
  ]
}
```

> `numDimensions` depende del modelo de embeddings usado. Con `Xenova/all-MiniLM-L6-v2` (recomendado, gratis y liviano) son 384 dimensiones. Si se cambia el modelo, actualizar aquí.

## Query típica del RAG

```js
db.knowledgechunks.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: embeddingDePregunta,
      numCandidates: 100,
      limit: 5,
      filter: { courseId: ObjectId("...") }
    }
  },
  { $project: { texto: 1, metadata: 1, score: { $meta: "vectorSearchScore" } } }
])
```

## Notas operativas

- Vector Search requiere cluster **M10 o superior** para producción estable (M0 sirve para desarrollo).
- El `filter` por `courseId` es obligatorio en toda query del bot — es la barrera que evita que un curso "vea" el contenido de otro.
