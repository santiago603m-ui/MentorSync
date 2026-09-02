import documentService from '../services/document.service.js';

class DocumentController {
  async subirDocumento(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'No se recibió ningún archivo' },
        });
      }

      const { documento, vistaPrevia } = await documentService.subirDocumento(
        req.usuario.id,
        req.params.cursoId,
        req.file
      );

      return res.status(201).json({
        success: true,
        message: 'Documento procesado correctamente',
        data: { documento, vistaPrevia },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarDocumentos(req, res, next) {
    try {
      const documentos = await documentService.listarDocumentosDeCurso(
        req.params.cursoId,
        req.usuario.id
      );
      return res.status(200).json({
        success: true,
        message: 'Documentos obtenidos correctamente',
        data: { documentos },
      });
    } catch (error) {
      next(error);
    }
  }

  async verChunks(req, res, next) {
    try {
      const chunks = await documentService.obtenerChunksDeDocumento(
        req.params.cursoId,
        req.params.documentoId,
        req.usuario.id
      );
      return res.status(200).json({
        success: true,
        message: 'Fragmentos obtenidos correctamente',
        data: { chunks },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();