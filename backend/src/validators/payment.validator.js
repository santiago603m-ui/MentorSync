import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

// Body de POST /api/pagos/checkout
export const esquemaCrearCheckout = z.object({
  cursoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido'),
});

// Nuestras referencias tienen el formato MS-<uuid v4>.
const esquemaParamsReferencia = z.object({
  referencia: z.string().regex(
    /^MS-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Referencia de pago inválida'
  ),
});

// El middleware `validar` existente solo valida req.body; este valida req.params.
export const validarParamsReferencia = (req, res, next) => {
  const resultado = esquemaParamsReferencia.safeParse(req.params);
  if (!resultado.success) {
    return next(new AppError('Referencia de pago inválida', 400, 'INVALID_PAYMENT_REFERENCE'));
  }
  return next();
};
