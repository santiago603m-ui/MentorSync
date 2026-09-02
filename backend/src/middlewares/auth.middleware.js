import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

const PREFIJO_TOKEN = 'Bearer ';

/**
 * Extrae y valida el JWT del header Authorization.
 * Si es válido, adjunta el payload decodificado en req.usuario.
 */
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith(PREFIJO_TOKEN)) {
    return next(new AppError('Acceso denegado. Token no proporcionado o con formato inválido', 401));
  }

  const token = authHeader.slice(PREFIJO_TOKEN.length);

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new AppError('Token inválido o expirado', 403));
  }
};
