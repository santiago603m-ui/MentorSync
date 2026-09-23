import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaCambiarRol, esquemaCambiarEstado, esquemaCrearUsuario } from '../validators/user.validator.js';
import usuarioController from '../controllers/user.controller.js';

const router = Router();

// Todo el módulo es solo para administradores
router.use(verificarToken, verificarRol('administrador'));

router.get('/resumen', usuarioController.resumen);
router.get('/', usuarioController.listar);
router.post('/', validar(esquemaCrearUsuario), usuarioController.crear);
router.patch('/:id/rol', validar(esquemaCambiarRol), usuarioController.cambiarRol);
router.patch('/:id/estado', validar(esquemaCambiarEstado), usuarioController.cambiarEstado);

export default router;
