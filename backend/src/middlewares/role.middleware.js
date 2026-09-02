import { AppError } from '../utils/AppError.js';

/**
 * Restringe una ruta a ciertos roles. Debe ir SIEMPRE después de verificarToken.
 * Uso: router.post('/cursos', verificarToken, verificarRol('mentor', 'administrador'), ...)
 */
export const verificarRol = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario?.rol) {
    return next(new AppError('No autorizado. Información de rol ausente', 401));
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return next(new AppError(`Acceso prohibido para el rol '${req.usuario.rol}'`, 403));
  }

  next();
};
