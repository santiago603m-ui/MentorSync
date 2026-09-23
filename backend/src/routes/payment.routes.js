import { Router } from 'express';
import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { exigirPagoSiCursoEsDePago } from '../middlewares/payment-required.middleware.js';
import { esquemaCrearCheckout, validarParamsReferencia } from '../validators/payment.validator.js';
import pagoController from '../controllers/payment.controller.js';

const router = Router();

/**
 * @openapi
 * /pagos/confirmacion:
 *   post:
 *     summary: Confirmación (webhook) de PayU. Pública, protegida por firma MD5.
 *     tags: [Pagos]
 *
 * IMPORTANTE: PayU envía este POST como application/x-www-form-urlencoded, NO como JSON.
 * Por eso esta ruta usa su propio middleware express.urlencoded, en vez del express.json()
 * global que ya tienes en server.js para el resto de la API.
 */
router.post('/confirmacion', express.urlencoded({ extended: false }), pagoController.recibirConfirmacion);

/**
 * @openapi
 * /pagos/checkout:
 *   post:
 *     summary: Crea un intento de pago y devuelve la acción + campos del formulario de PayU
 *     tags: [Pagos]
 */
router.post(
  '/checkout',
  verificarToken,
  verificarRol('aprendiz'),
  validar(esquemaCrearCheckout),
  pagoController.crearCheckout
);

/**
 * @openapi
 * /pagos/estado/{referencia}:
 *   get:
 *     summary: Consulta el estado de un pago guardado en nuestra base de datos (no en PayU)
 *     tags: [Pagos]
 */
router.get(
  '/estado/:referencia',
  verificarToken,
  verificarRol('aprendiz'),
  validarParamsReferencia,
  pagoController.consultarEstado
);

export default router;

/**
 * Router aparte que se monta en /api/cursos ANTES de course.routes.js.
 * Intercepta solo POST /:id/inscribir; los cursos gratis continúan al flujo original.
 */
export const proteccionInscripcion = Router().post(
  '/:id/inscribir',
  verificarToken,
  exigirPagoSiCursoEsDePago
);