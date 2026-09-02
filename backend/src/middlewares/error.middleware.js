/**
 * Middleware centralizado de errores — SIEMPRE se monta al final,
 * después de todas las rutas. Todo error de un controller llega aquí
 * vía next(error).
 */
export const manejarErrores = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  // Log estructurado con pino (req.log lo inyecta pino-http)
  if (req.log) {
    req.log.error({ err: error }, error.message);
  } else {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      // En 500 no exponemos el mensaje real del error (puede filtrar detalles
      // internos); en el resto de códigos el mensaje sí viene de un AppError
      // intencional del service, así que es seguro mostrarlo.
      message: statusCode === 500 ? 'Error interno del servidor' : error.message,
    },
  });
};