import { AppError } from '../utils/AppError.js';
import cursoService from '../services/course.service.js';

export const exigirPagoSiCursoEsDePago = async (req, res, next) => {
  try {
    const curso = await cursoService.obtenerCursoPorId(req.params.id);
    if (curso.precio > 0) {
      return next(
        new AppError('Este curso es de pago. Completa el pago para inscribirte.', 402, 'PAYMENT_REQUIRED')
      );
    }
    return next();
  } catch (error) {
    if (error.statusCode === 404 || error.name === 'CastError') return next();
    return next(error);
  }
};
