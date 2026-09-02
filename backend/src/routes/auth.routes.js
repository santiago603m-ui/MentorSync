import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaRegistro, esquemaInicioSesion } from '../validators/auth.validator.js';

const router = Router();

// Rutas públicas
router.post('/registro', validar(esquemaRegistro), authController.registrar);
router.post('/inicio-sesion', validar(esquemaInicioSesion), authController.iniciarSesion);

// Ruta de prueba protegida
router.get(
  '/perfil-protegido',
  verificarToken,
  verificarRol('aprendiz', 'mentor', 'administrador'),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Acceso concedido a ruta protegida',
      data: { usuario: req.usuario },
    });
  }
);

export default router;
