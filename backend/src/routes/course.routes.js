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
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
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


// ==========================================
// Generar estructura con IA (usa el texto ya procesado del curso, no recibe archivo)
// ==========================================
router.post(
  '/:id/generar-estructura',
  verificarToken,
  verificarRol('mentor'),
  courseController.generarEstructura
);

// 👇 aquí va el multer: esta ruta sí recibe el archivo de imagen
router.post(
  '/:id/subir-imagen',
  verificarToken,
  verificarRol('mentor'),
  upload.single('portadaUrl'),
  courseController.subirImagenCurso
);

router.post(
  '/:id/inscribir',
  verificarToken,
  courseController.inscribirCurso // 👈 asegúrate de crear este método en el controlador
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
router.delete('/:id/inscritos/:inscritoId', verificarToken, verificarRol('aprendiz'), courseController.cancelarInscripcion);

export default router;