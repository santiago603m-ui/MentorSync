import { AppError } from '../utils/AppError.js';

/**
 * Middleware genérico de validación con Zod.
 * Uso: router.post('/registro', validar(esquemaRegistro), controller.registrar)
 *
 * Si la validación pasa, reemplaza req.body con los datos ya limpios/tipados
 * que devuelve Zod (por ejemplo, con el email ya en minúsculas).
 */
export const validar = (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req.body);

  if (!resultado.success) {
    // Zod v4 renombró `error.errors` a `error.issues`.
    const mensaje = resultado.error.issues.map((e) => e.message).join(', ');
    return next(new AppError(mensaje, 400));
  }

  req.body = resultado.data;
  next();
};
