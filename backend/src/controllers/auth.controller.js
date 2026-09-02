import authService from '../services/auth.service.js';

/**
 * Controller de autenticación.
 * Regla del proyecto: el controller SOLO recibe/responde HTTP.
 * Toda la lógica vive en authService. Ver docs/03_BACKEND_GUIDELINES.md
 */
class AuthController {
  async registrar(req, res, next) {
    try {
      const usuario = await authService.registrar(req.body);

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: { usuario },
      });
    } catch (error) {
      next(error);
    }
  }

  async iniciarSesion(req, res, next) {
    try {
      const { token, usuario } = await authService.iniciarSesion(req.body);

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: { token, usuario },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
