import authService from '../services/auth.service.js';

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: user
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new AuthController();