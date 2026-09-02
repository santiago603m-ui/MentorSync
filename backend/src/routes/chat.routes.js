import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaPregunta } from '../validators/chat.validator.js';
import chatController from '../controllers/chat.controller.js';

const router = Router();

// Cualquier rol autenticado puede preguntarle al bot de un curso
router.post(
  '/:cursoId/chat',
  verificarToken,
  verificarRol('aprendiz', 'mentor', 'administrador'),
  validar(esquemaPregunta),
  chatController.enviarPregunta
);

router.get('/chat/historial/:threadId', verificarToken, chatController.obtenerHistorial);

export default router;