import { Router, urlencoded } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaCrearCheckout, validarParamsReferencia } from '../validators/payment.validator.js';
import pagoController from '../controllers/payment.controller.js';

const router = Router();

/**
 * @openapi
 * /pagos/confirmacion:
 *   post:
 *     summary: Confirmación server-to-server de PayU
 *     tags: [Pagos]
 *     description: Ruta pública protegida por la firma MD5 enviada por PayU.
 */
router.post('/confirmacion', urlencoded({ extended: false, limit: '100kb' }), pagoController.recibirConfirmacion);

/**
 * @openapi
 * /pagos/checkout:
 *   post:
 *     summary: Crea un intento de pago y devuelve el formulario Web Checkout firmado
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
 *     summary: Consulta el estado local de un pago del usuario autenticado
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
