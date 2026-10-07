import Pago from '../models/payment.model.js';

class PagoRepository {
  async crear(datosPago) {
    return Pago.create(datosPago);
  }

  async buscarPorReferencia(referencia) {
    return Pago.findOne({ referencia });
  }

  async existeAprobado(usuarioId, cursoId) {
    return Pago.exists({ 'usuario.id': usuarioId, curso: cursoId, estado: 'APROBADO' });
  }

  async actualizarEstado(id, { estado, estadoEsperado, pasarela }) {
    return Pago.findOneAndUpdate(
      { _id: id, estado: estadoEsperado },
      {
        $set: {
          estado,
          'pasarela.proveedor': pasarela.proveedor,
          'pasarela.idPago': pasarela.idPago,
          'pasarela.metodo': pasarela.metodo,
          'pasarela.estadoOriginal': pasarela.estadoOriginal,
          'pasarela.detalle': pasarela.detalle,
          'pasarela.evento': pasarela.evento,
        },
      },
      { new: true, runValidators: true }
    );
  }

  async reclamarInscripcion(id) {
    return Pago.findOneAndUpdate(
      { _id: id, estado: 'APROBADO', inscripcionAplicada: false },
      { $set: { inscripcionAplicada: true } },
      { new: true, runValidators: true }
    );
  }

  async liberarInscripcion(id) {
    return Pago.findByIdAndUpdate(
      { _id: id, estado: 'APROBADO' },
      { $set: { inscripcionAplicada: false } },
      { new: true, runValidators: true }
    );
  }
}

export default new PagoRepository();