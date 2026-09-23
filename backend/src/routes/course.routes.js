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
// Panel admin: todos los cursos en cualquier estado.
// Va antes de '/:id' para que Express no interprete "admin" como un id
router.get(
  '/admin/todos',
  verificarToken,
  verificarRol('administrador'),
  courseController.listarTodosAdmin
);
router.get('/:id', courseController.obtenerCurso);

// Mentores sobre sus propios cursos; el administrador tiene bypass total
router.post(
  '/',
  verificarToken,
  verificarRol('mentor', 'administrador'),
  validar(esquemaCrearCurso),
  courseController.crearCurso
);

// ==========================================
// NUEVA RUTA AGREGADA (Generar estructura con IA)
// ==========================================
router.post(
  '/:id/generar-estructura',
  verificarToken,
  verificarRol('mentor'),
  courseController.generarEstructura
);
router.post(
  '/:id/inscribir',
  verificarToken,
  courseController.inscribirCurso // 👈 asegúrate de crear este método en el controlador
);

router.patch(
  '/:id',
  verificarToken,
  verificarRol('mentor', 'administrador'),
  validar(esquemaActualizarCurso),
  courseController.actualizarCurso
);
router.patch(
  '/:id/estado',
  verificarToken,
  verificarRol('mentor', 'administrador'),
  validar(esquemaCambiarEstado),
  courseController.cambiarEstadoCurso
);
router.delete('/:id', verificarToken, verificarRol('mentor', 'administrador'), courseController.eliminarCurso);
router.delete('/:id/inscritos/:inscritoId', verificarToken, verificarRol('aprendiz'), courseController.cancelarInscripcion);

export default router;