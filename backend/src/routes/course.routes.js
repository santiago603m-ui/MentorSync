import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import {
  esquemaCrearCurso,
  esquemaActualizarCurso,
  esquemaCambiarEstado,
} from '../validators/course.validator.js';
import courseController from '../controllers/course.controller.js';

const router = Router();

// Públicas
router.get('/', courseController.listarCursosPublicados);

// Va antes de '/:id' para que Express no interprete "mis-cursos" como un id
router.get(
  '/mis-cursos',
  verificarToken,
  verificarRol('mentor'),
  courseController.listarMisCursos
);
router.get('/:id', courseController.obtenerCurso);

// Solo mentores, sobre sus propios cursos (el service valida propiedad)
router.post(
  '/',
  verificarToken,
  verificarRol('mentor'),
  validar(esquemaCrearCurso),
  courseController.crearCurso
);
router.patch(
  '/:id',
  verificarToken,
  verificarRol('mentor'),
  validar(esquemaActualizarCurso),
  courseController.actualizarCurso
);
router.patch(
  '/:id/estado',
  verificarToken,
  verificarRol('mentor'),
  validar(esquemaCambiarEstado),
  courseController.cambiarEstadoCurso
);
router.delete('/:id', verificarToken, verificarRol('mentor'), courseController.eliminarCurso);

export default router;