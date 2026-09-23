import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaCrearSesion, esquemaCambiarEstadoSesion } from '../validators/liveSession.validator.js';
import liveSessionController from '../controllers/liveSession.controller.js';

const router = Router();

// Todas requieren auth
router.use(verificarToken);

router.post('/', verificarRol('mentor', 'administrador'), validar(esquemaCrearSesion), liveSessionController.crear);
router.get('/curso/:cursoId', liveSessionController.listarPorCurso);
router.get('/:id', liveSessionController.obtener);
router.get('/:id/mensajes', liveSessionController.listarMensajes);
router.patch('/:id/estado', verificarRol('mentor', 'administrador'), validar(esquemaCambiarEstadoSesion), liveSessionController.cambiarEstado);

export default router;
