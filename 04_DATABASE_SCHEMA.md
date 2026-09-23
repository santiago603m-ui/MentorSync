# 🗄️ Base de Datos — MongoDB Atlas

> ⚠️ Este documento refleja el esquema **realmente implementado** en `backend/src/models/`. Para el detalle método por método de cada capa, ver `06_API_MODELS_REFERENCE.md`.

## Colecciones

### `usuarios`  (modelo `Usuario`, `user.model.js`)
```
_id
nombre, email (único), contraseñaHash   // select:false, nunca se trae por defecto
rol: "aprendiz" | "mentor" | "administrador"   // default "aprendiz"
perfilMentor: { bio, especialidad, verificado }   // default: undefined — solo si rol = "mentor"
activo: Boolean   // default true, borrado lógico (filtra login y listarUsuarios)
createdAt, updatedAt
```

> La relación usuario↔curso no es por arrays embebidos en usuario — se resuelve por `mentor` en `cursos` y por `inscritos[]` en `cursos` (embebido) + futuro `enrollments` (sin uso).

### `cursos`  (modelo `Curso`, `course.model.js`)
```
_id
mentor (ref → usuarios), requerido
titulo (máx 120), descripcion (máx 2000), categoria
portadaUrl: String | null
estado: "borrador" | "publicado" | "archivado"   // default "publicado" (no "borrador")
precio: Number   // default 0, min 0
duracionEstimadaHoras: Number   // default 0, min 0
contenidoTextoPlano: String | null   // texto extraído del PDF para Groq generar estructura
modulos: [
  {
    titulo: String, requerido
    descripcion: String
    orden: Number
    lecciones: [
      { titulo: String, requerido, contenido: String, requerido, puntosClave: [String], orden: Number }
    ]
  }
]
bot: {
  entrenado: Boolean,              // default false, se pone true tras generarEstructuraCurso
  fechaEntrenamiento: Date | null,
  documentoOrigenNombre: String | null,
  totalChunks: Number              // default 0
}
activo: Boolean   // default true, borrado lógico
inscritos: [
  { _id: ObjectId, id: ObjectId → usuarios, nombre: String, correo: String }  // $addToSet / $pull por _id
]
createdAt, updatedAt
```
Índices: `{ mentor: 1 }`, `{ estado: 1 }`.

### `enrollments`  (modelo `Enrollment`, `enrollment.model.js`) — sin repository/service (reservado)
```
_id
userId (ref → usuarios), requerido
courseId (ref → cursos), requerido
estado: "activo" | "completado" | "suspendido"   // default "activo"
progreso: Number   // default 0 (sin min/max en schema)
createdAt, updatedAt
```
Índice único `{ userId: 1, courseId: 1 }` — hoy no se usa (inscripciones van embebidas en `cursos.inscritos`).

### `knowledgechunks`  ⭐ colección clave del RAG (modelo `KnowledgeChunk`)
```
_id
courseId (ref → cursos), requerido       // filtro OBLIGATORIO en toda $vectorSearch
documentId (ref → documents), requerido
texto            // fragmento
embedding: [Number]   // 384D con Xenova/all-MiniLM-L6-v2
metadata: { pagina, seccion }
createdAt, updatedAt
```
Repository `knowledgeChunk.repository` con `guardarLote`, `buscarPorDocumento`, `eliminarPorDocumento`, `buscarSimilares(courseId, vector, limite)` (`numCandidates=limite*20`, cosine).

### `documents`  (modelo `Document`)
```
_id
courseId (ref → cursos), requerido
mentorId (ref → usuarios), requerido
nombreOriginal, fileUrl, requeridos
tipo: "pdf" | "txt" | "enlace"   // default "pdf"
estado: "pendiente" | "procesando" | "completado" | "error"   // default "pendiente"
errorMessage: String
createdAt, updatedAt
```
Implementado con repository/service/controller/routes. Cloudinary `resource_type:'raw'`, carpeta `mentorsync/documentos`.

### `chatmessages`  (modelo `ChatMessage`)
```
_id
courseId (ref → cursos), requerido
threadId: String, indexado          // UUID v4 agrupa conversación
liveSessionId (ref → LiveSession)   // null fuera de sesión
remitenteId (ref → usuarios)        // null si remitente es bot
rolRemitente: "aprendiz" | "mentor" | "bot", requerido
contenido: String, requerido
esRespuestaBot: Boolean   // default false
createdAt, updatedAt
```
Implementado con repository (`crear`, `listarPorThread`, `listarPorCurso`) + service (`enviarPregunta` valida curso `publicado`, genera `threadId` si falta, guarda pregunta, llama RAG, guarda respuesta bot).

### `livesessions`  (modelo `LiveSession`) — solo modelo (sin repository)
```
_id
courseId (ref → cursos), requerido
mentorId (ref → usuarios), requerido
titulo, requerido
estado: "programada" | "en_curso" | "finalizada" | "cancelada"   // default "programada"
fechaInicioProgramada: Date, requerido
fechaInicioReal, fechaFin: Date
urlReunion: String
transcript: String
asistentes: [ObjectId] (ref → usuarios)
createdAt, updatedAt
```

## Índice de Vector Search (Atlas)

Sobre `knowledgechunks.embedding`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "courseId" }
  ]
}
```

> `numDimensions=384` para `Xenova/all-MiniLM-L6-v2`. Si cambia modelo, actualizar aquí.

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

- Atlas Vector Search requiere cluster **M10+** en prod (M0 sirve en dev).
- `filter` por `courseId` es obligatorio — evita fuga entre cursos.
- `cursos.inscritos` es embebido con `_id` propio; se manipula con `$addToSet` / `$pull: { _id }` (ver `course.repository.inscribirAprendiz`/`cancelarInscripcion`).
- `cursos.modulos` y `contenidoTextoPlano` son nuevos (generados por Groq), no afectan el índice vectorial.
