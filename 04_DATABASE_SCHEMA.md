# 🗄️ Base de Datos — MongoDB Atlas

## Colecciones

### `users`
```
_id
nombre, email, passwordHash
rol: "aprendiz" | "mentor" | "administrador"
perfilMentor: { bio, especialidad, verificado }   // solo si rol = "mentor"
cursosInscritos: [ObjectId]                        // solo aprendiz
cursosCreados: [ObjectId]                           // solo mentor
createdAt, updatedAt
```

### `courses`
```
_id
mentorId (ref → users)
titulo, descripcion, categoria
estado: "activo" | "borrador"
fechasSesionesEnVivo: [Date]
createdAt, updatedAt
```

### `knowledgeChunks`  ⭐ colección clave del RAG
```
_id
courseId (ref → courses)
mentorId
texto            // fragmento del PDF
embedding: [Number]   // vector generado localmente con @xenova/transformers
metadata: { pagina, seccion, nombreArchivo }
createdAt
```

### `chatMessages`
```
_id
courseId
remitente: "aprendiz" | "mentor" | "bot"
contenido
esRespuestaBot: Boolean
timestamp
```

### `liveSessions`
```
_id
courseId, mentorId
transcript / resumenAuto
asistentes: [ObjectId]
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
