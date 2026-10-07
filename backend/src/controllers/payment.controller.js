import pagoService from '../services/payment.service.js';

class PagoController {
  async crearCheckout(req, res, next) {
    try {
      const data = await pagoService.crearCheckout(req.usuario, req.body.cursoId);
      return res.status(201).json({ success: true, message: 'Checkout creado correctamente', data });
    } catch (error) {
      return next(error);
    }
  }

  async consultarEstado(req, res, next) {
    try {
      const data = await pagoService.consultarEstadoLocal(req.params.referencia, req.usuario.id);
      return res.status(200).json({ success: true, message: 'Estado del pago obtenido correctamente', data });
    } catch (error) {
      return next(error);
    }
  }

  async simularPago(req, res, next) {
    try {
      const data = await pagoService.simularPago(req.params.referencia, req.usuario.id, req.body.resultado);
      return res.status(200).json({ success: true, message: 'Pago simulado correctamente', data });
    } catch (error) {
      return next(error);
    }
  }

  async recibirConfirmacion(req, res, next) {
    try {
      await pagoService.procesarConfirmacion(req.body, req.headers, req.query);
      return res.status(200).send('OK');
    } catch (error) {
      return next(error);
    }
  }
}

export default new PagoController();
