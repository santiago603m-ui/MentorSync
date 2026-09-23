import { AppError } from '../utils/AppError.js';
import cursoService from '../services/course.service.js';

/**
 * Bloquea la inscripción DIRECTA (POST /api/cursos/:id/inscribir) a cursos con precio > 0.
 * Sin esto, cualquier usuario podría saltarse el pago llamando al endpoint viejo a mano.
 *
 * - Curso gratis (precio 0)         → next(): sigue el flujo EXISTENTE sin cambios.
 * - Curso de pago                   → 402 Payment Required.
 * - Curso inexistente / id inválido → next(): el controller existente responde 404/400 como siempre.
 * La inscripción por pago NO pasa por aquí: la hace payment.service.js llamando al service.
 */
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
    // 404 o id con formato inválido (CastError): dejamos que responda el handler original.
    if (error.statusCode === 404 || error.name === 'CastError') return next();
    return next(error);
  }
};