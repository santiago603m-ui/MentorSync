// Ver docs/03_BACKEND_GUIDELINES.md — todos los errores lanzados desde
// services deben usar esta clase (o una que herede de ella), nunca `Error` a secas.
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    // Si no se pasa code explícito, se deriva uno genérico del statusCode.
    // Así los `throw new AppError(mensaje, codigo)` que ya existen en el
    // código (sin tercer argumento) siguen funcionando sin tocarlos.
    this.code = code || AppError.codigoPorDefecto(statusCode);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static codigoPorDefecto(statusCode) {
    const mapa = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return mapa[statusCode] || 'ERROR';
  }
}