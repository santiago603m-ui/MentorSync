import Pago from '../models/payment.model.js';

// Repository Pattern: única capa que conoce Mongoose para pagos.
class PagoRepository {
  async crear(datosPago) {
    return Pago.create(datosPago);
  }

  async buscarPorReferencia(referencia) {
    return Pago.findOne({ referencia });
  }

  // ¿Este aprendiz ya tiene un pago aprobado para este curso?
  async existeAprobado(usuarioId, cursoId) {
    return Pago.exists({ 'usuario.id': usuarioId, curso: cursoId, estado: 'APROBADO' });
  }

  async actualizarEstado(id, { estado, wompi }) {
    return Pago.findByIdAndUpdate(
      id,
      {
        $set: {
          estado,
          'wompi.transaccionId': wompi.transaccionId,
          'wompi.metodoPago': wompi.metodoPago,
          'wompi.estadoOriginal': wompi.estadoOriginal,
        },
      },
      { new: true }
    );
  }

  /**
   * Compare-and-set ATÓMICO: pasa inscripcionAplicada de false → true solo si el pago
   * está APROBADO. Si el webhook y la consulta desde el navegador llegan a la vez,
   * exactamente UNA de las dos recibe el documento (la otra recibe null) y es la única
   * que inscribe al aprendiz. Así nunca se inscribe dos veces.
   */
  async reclamarInscripcion(id) {
    return Pago.findOneAndUpdate(
      { _id: id, estado: 'APROBADO', inscripcionAplicada: false },
      { $set: { inscripcionAplicada: true } },
      { new: true }
    );
  }

  // Si la inscripción falló después de reclamarla, se libera para poder reintentar.
  async liberarInscripcion(id) {
    return Pago.findByIdAndUpdate(id, { $set: { inscripcionAplicada: false } });
  }
}

export default new PagoRepository();