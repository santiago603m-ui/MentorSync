import pagoService from '../services/payment.service.js';

class PagoController {
  // Devuelve la acción y los campos del formulario que el frontend debe enviar por POST a PayU
  async crearCheckout(req, res, next) {
    try {
      const data = await pagoService.crearCheckout(req.usuario, req.body.cursoId);
      return res.status(201).json({ success: true, message: 'Checkout creado correctamente', data });
    } catch (error) {
      next(error);
    }
  }

  // Consulta el estado guardado en NUESTRA base de datos (no le preguntamos a PayU: su
  // página de respuesta no es confiable; la confirmación/webhook ya la actualizó).
  async consultarEstado(req, res, next) {
    try {
      const data = await pagoService.consultarEstadoLocal(req.params.referencia, req.usuario.id);
      return res.status(200).json({ success: true, message: 'Estado del pago obtenido correctamente', data });
    } catch (error) {
      next(error);
    }
  }

  // Confirmación (webhook) de PayU. Si la firma es inválida, el service lanza 401.
  // PayU reintenta si no recibe 200, así que un error transitorio (p. ej. BD caída) → 500 y listo.
  async recibirConfirmacion(req, res, next) {
    try {
      await pagoService.procesarConfirmacion(req.body);
      return res.status(200).send('OK'); // PayU espera 200 en texto plano, no necesita JSON
    } catch (error) {
      next(error);
    }
  }
}

export default new PagoController();