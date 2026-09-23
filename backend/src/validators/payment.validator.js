import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

// Body de POST /api/pagos/checkout
export const esquemaCrearCheckout = z.object({
  cursoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido'),
});

// Param de GET /api/pagos/transaccion/:transaccionId (ids de Wompi: dígitos, letras y guiones)
const esquemaParamsTransaccion = z.object({
  transaccionId: z.string().regex(/^[A-Za-z0-9_-]{5,64}$/, 'ID de transacción inválido'),
});

// El middleware `validar` existente solo valida req.body; este valida req.params.
export const validarParamsTransaccion = (req, res, next) => {
  const resultado = esquemaParamsTransaccion.safeParse(req.params);
  if (!resultado.success) {
    return next(new AppError('ID de transacción inválido', 400));
  }
  next();
};