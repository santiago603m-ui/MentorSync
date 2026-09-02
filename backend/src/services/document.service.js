import streamifier from 'streamifier';
import pdfParse from 'pdf-parse';
import cloudinary from '../config/cloudinary.js';
import documentRepository from '../repositories/document.repository.js';
import cursoService from './course.service.js';
import { AppError } from '../utils/AppError.js';

import knowledgeChunkRepository from '../repositories/knowledgeChunk.repository.js';
import { fragmentarTexto } from '../utils/textChunker.js';
import embeddingService from './embedding.service.js';

function subirBufferACloudinary(buffer, nombreOriginal) {
  return new Promise((resolve, reject) => {
    const streamUpload = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'mentorsync/documentos',
        public_id: `${Date.now()}-${nombreOriginal.replace(/\.pdf$/i, '')}`,
      },
      (error, resultado) => {
        if (error) return reject(error);
        resolve(resultado);
      }
    );
    streamifier.createReadStream(buffer).pipe(streamUpload);
  });
}

class DocumentService {
  async subirDocumento(mentorId, cursoId, archivo) {
    if (!archivo) {
      throw new AppError('No se recibió ningún archivo', 400, 'BAD_REQUEST');
    }

    // Verifica que el curso exista y pertenezca al mentor autenticado
    const curso = await cursoService.obtenerCursoPorId(cursoId);
    cursoService.verificarPropiedad(curso, mentorId);

    // Registro inicial en estado "pendiente"
    let documento = await documentRepository.crear({
      courseId: cursoId,
      mentorId,
      nombreOriginal: archivo.originalname,
      fileUrl: '',
      tipo: 'pdf',
      estado: 'pendiente',
    });

    try {
      const resultadoCloudinary = await subirBufferACloudinary(archivo.buffer, archivo.originalname);
      const { text: textoExtraido, numpages } = await pdfParse(archivo.buffer);

      // --- INICIO LÓGICA DE CHUNKING Y EMBEDDINGS ---
      const fragmentosTexto = fragmentarTexto(textoExtraido);

      const chunksParaGuardar = await Promise.all(
        fragmentosTexto.map(async (texto, index) => {
          const vectorEmbedding = await embeddingService.generarEmbedding(texto);
          return {
            courseId: cursoId,
            documentId: documento._id,
            texto: texto,
            embedding: vectorEmbedding, // Vector de 384 dimensiones
            metadata: {
              pagina: 1, // Por defecto general
              seccion: `Fragmento ${index + 1}`,
            },
          };
        })
      );

      // Guardamos en la base de datos solo si se extrajo texto válido
      if (chunksParaGuardar.length > 0) {
        await knowledgeChunkRepository.guardarLote(chunksParaGuardar);
      }
      // --- FIN LÓGICA DE CHUNKING Y EMBEDDINGS ---

      documento = await documentRepository.actualizarEstado(documento._id, {
        estado: 'completado',
        fileUrl: resultadoCloudinary.secure_url,
      });

      // El texto NO se persiste en el modelo Document todavía (decisión pendiente,
      // ver nota en 06_REFERENCIA_METODOS.md). El chunking, cuando se implemente,
      // vuelve a descargar el PDF desde fileUrl y lo re-extrae.
      return {
        documento,
        vistaPrevia: {
          totalPaginas: numpages,
          totalCaracteres: textoExtraido.length,
          totalFragmentos: chunksParaGuardar.length,
          dimensionesEmbedding: chunksParaGuardar[0]?.embedding?.length || 0,
          fragmento: textoExtraido.slice(0, 300),
        },
      };
    } catch (error) {
      // El error real queda en error.middleware.js vía next(error) más arriba en
      // la cadena (Controller → aquí se relanza como AppError). No usamos
      // console.error aquí: los logs van por pino/pino-http, no por consola directa.
      await documentRepository.actualizarEstado(documento._id, {
        estado: 'error',
        errorMessage: error.message,
      });
      throw new AppError('No se pudo procesar el PDF', 500, 'DOCUMENT_PROCESSING_FAILED');
    }
  }

  async listarDocumentosDeCurso(cursoId, mentorId) {
    const curso = await cursoService.obtenerCursoPorId(cursoId);
    cursoService.verificarPropiedad(curso, mentorId);
    return documentRepository.listarPorCurso(cursoId);
  }

  // Antes esto vivía en document.controller.js llamando a knowledgeChunkRepository
  // directo, rompiendo la capa Controller → Service → Repository. Ahora pasa por acá.
  async obtenerChunksDeDocumento(cursoId, documentoId, mentorId) {
    const curso = await cursoService.obtenerCursoPorId(cursoId);
    cursoService.verificarPropiedad(curso, mentorId);

    const documento = await documentRepository.buscarPorId(documentoId);
    const idDelCursoDelDocumento = documento?.courseId?._id
      ? documento.courseId._id.toString()
      : documento?.courseId?.toString();

    if (!documento || idDelCursoDelDocumento !== cursoId.toString()) {
      throw new AppError('Documento no encontrado en este curso', 404, 'DOCUMENT_NOT_FOUND');
    }

    return knowledgeChunkRepository.buscarPorDocumento(documentoId);
  }
}

export default new DocumentService();