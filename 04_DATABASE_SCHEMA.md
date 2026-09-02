# 🗄️ Base de Datos — MongoDB Atlas

## Colecciones

Los schemas de Mongoose viven en `backend/src/models/*.model.js`. Este documento
describe su forma lógica; el código fuente de cada modelo es la referencia exacta
de tipos, defaults y validaciones.

### `users` (`user.model.js`)
```
_id
nombre, email (unique), passwordHash
rol: "aprendiz" | "mentor" | "administrador"        // default: "aprendiz"
perfilMentor: { bio, especialidad, verificado }       // solo relevante si rol = "mentor"
isActive: Boolean                                      // borrado lógico, default: true
createdAt, updatedAt
```
> Las inscripciones a cursos ya NO se guardan como array embebido aquí — ver `enrollments`.

### `courses` (`course.model.js`)
```
_id
mentorId (ref → users)
titulo, descripcion, categoria
estado: "borrador" | "activo" | "archivado"           // default: "borrador"
isActive: Boolean                                      // borrado lógico, default: true
createdAt, updatedAt
```

### `enrollments` (`enrollment.model.js`)
Desacopla la relación aprendiz↔curso del documento de `users` y permite medir progreso.
```
_id
userId (ref → users)
courseId (ref → courses)
estado: "activo" | "completado" | "suspendido"        // default: "activo"
progreso: Number                                        // 0-100, default: 0
createdAt, updatedAt
```
> Índice único compuesto `{ userId: 1, courseId: 1 }` — un usuario no puede inscribirse dos veces al mismo curso.

### `documents` (`document.model.js`)
Registra cada PDF subido por un mentor y el estado de su procesamiento (chunking + embeddings).
```
_id
courseId (ref → courses)
mentorId (ref → users)
nombreOriginal, fileUrl
tipo: "pdf" | "txt" | "enlace"                         // default: "pdf"
estado: "pendiente" | "procesando" | "completado" | "error"   // default: "pendiente"
errorMessage                                            // motivo si el job de procesamiento falla
createdAt, updatedAt
```
> El frontend consulta `estado` para saber si el job de vectorización ya terminó antes de habilitar el bot.

### `knowledgeChunks` (`knowledgeChunk.model.js`) ⭐ colección clave del RAG
```
_id
courseId (ref → courses)
documentId (ref → documents)
texto                    // fragmento del PDF
embedding: [Number]      // vector generado localmente con @xenova/transformers
metadata: { pagina, seccion }
createdAt, updatedAt
```

### `chatMessages` (`chatMessage.model.js`)
```
_id
courseId (ref → courses)
threadId                 // agrupa una sesión de conversación con el bot (indexado)
liveSessionId (ref → liveSessions)   // nulo si es chat con el bot fuera de una sesión en vivo
remitenteId (ref → users)            // nulo si el mensaje lo generó el bot
rolRemitente: "aprendiz" | "mentor" | "bot"
contenido
esRespuestaBot: Boolean
createdAt, updatedAt
```

### `liveSessions` (`liveSession.model.js`)
```
_id
courseId (ref → courses), mentorId (ref → users)
titulo
estado: "programada" | "en_curso" | "finalizada" | "cancelada"   // default: "programada"
fechaInicioProgramada, fechaInicioReal, fechaFin
urlReunion
transcript                // opcional, si se transcribe la sesión
asistentes: [ObjectId] (ref → users)
createdAt, updatedAt
```

## Índice de Vector Search (Atlas)

Definido sobre `knowledgeChunks`, campo `embedding`:

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
db.knowledgeChunks.aggregate([
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
