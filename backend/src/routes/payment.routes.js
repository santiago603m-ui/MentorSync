import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/role.middleware.js';
import { validar } from '../middlewares/validar.middleware.js';
import { esquemaCrearCheckout, esquemaSimularPago, validarParamsReferencia } from '../validators/payment.validator.js';
import pagoController from '../controllers/payment.controller.js';

const router = Router();

router.post(
  '/simular/:referencia',
  verificarToken,
  verificarRol('aprendiz'),
  validarParamsReferencia,
  validar(esquemaSimularPago),
  pagoController.simularPago
);

// Webhook público JSON de Mercado Pago; la firma se valida en el service.
router.post('/confirmacion', pagoController.recibirConfirmacion);

router.post(
  '/checkout',
  verificarToken,
  verificarRol('aprendiz'),
  validar(esquemaCrearCheckout),
  pagoController.crearCheckout
);

router.get(
  '/estado/:referencia',
  verificarToken,
  verificarRol('aprendiz'),
  validarParamsReferencia,
  pagoController.consultarEstado
);

export default router;
