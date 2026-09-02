import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { VerificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';

const router = Router();

// Rutas públicas
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Ruta de prueba protegida
router.get('/perfil-protegido', VerificarToken, verificarRol('aprendiz', 'mentor', 'administrador'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Acceso concedido a ruta protegida',
    user: req.user
  });
});

export default router;