import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const esquemaCrearCheckout = z.object({
  cursoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido'),
});

export const esquemaSimularPago = z.object({
  resultado: z.enum(['aprobado', 'rechazado'], {
    error: 'El resultado debe ser aprobado o rechazado',
  }),
});

const esquemaParamsReferencia = z.object({
  referencia: z.string().regex(
    /^MS-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Referencia de pago inválida'
  ),
});

export const validarParamsReferencia = (req, res, next) => {
  const resultado = esquemaParamsReferencia.safeParse(req.params);
  if (!resultado.success) {
    return next(new AppError('Referencia de pago inválida', 400, 'INVALID_PAYMENT_REFERENCE'));
  }
  return next();
};
