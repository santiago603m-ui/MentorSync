import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

// Body de POST /api/pagos/checkout
export const esquemaCrearCheckout = z.object({
  cursoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido'),
});

// Param de GET /api/pagos/estado/:referencia — nuestras referencias son "MS-<uuid>"
const esquemaParamsReferencia = z.object({
  referencia: z.string().regex(/^MS-[0-9a-fA-F-]{36}$/, 'Referencia inválida'),
});

// El middleware `validar` existente solo valida req.body; este valida req.params.
export const validarParamsReferencia = (req, res, next) => {
  const resultado = esquemaParamsReferencia.safeParse(req.params);
  if (!resultado.success) {
    return next(new AppError('Referencia de pago inválida', 400));
  }
  next();
};