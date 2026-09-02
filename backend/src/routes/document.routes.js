import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import documentController from '../controllers/document.controller.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = ['application/pdf', 'application/x-pdf'];

    if (allowedMimeTypes.includes(file.mimetype) || ext === '.pdf') {
      cb(null, true);
    } else {
      return cb(new AppError('Solo se permiten archivos PDF', 400));
    }
  },
});

router.post(
  '/:cursoId/documentos',
  verificarToken,
  verificarRol('mentor'),
  upload.single('archivo'),
  documentController.subirDocumento
);

router.get(
  '/:cursoId/documentos',
  verificarToken,
  verificarRol('mentor'),
  documentController.listarDocumentos
);

router.get(
  '/:cursoId/documentos/:documentoId/chunks',
  verificarToken,
  verificarRol('mentor'),
  documentController.verChunks
);

export default router;