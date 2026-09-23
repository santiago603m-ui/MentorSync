import Usuario from '../models/user.model.js';

// Repository Pattern: única capa que conoce Mongoose.
// Campos sensibles (contraseñaHash) nunca salen de aquí.
const PROYECCION_SEGURA = '-contraseñaHash -__v';

class UsuarioRepository {
  async listar({ rol, busqueda, pagina = 1, limite = 100, soloActivos = false }) {
    const filtros = {};

    if (rol) filtros.rol = rol;
    if (soloActivos) filtros.activo = true;
    if (busqueda) {
      filtros.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { email: { $regex: busqueda, $options: 'i' } },
      ];
    }

    const salto = (pagina - 1) * limite;
    const [usuarios, total] = await Promise.all([
      Usuario.find(filtros)
        .select(PROYECCION_SEGURA)
        .sort({ createdAt: -1 })
        .skip(salto)
        .limit(limite)
        .lean(),
      Usuario.countDocuments(filtros),
    ]);

    return { usuarios, total, pagina, limite };
  }

  async contarPorRol() {
    const filas = await Usuario.aggregate([
      { $group: { _id: '$rol', total: { $sum: 1 } } },
    ]);

    const resumen = { administrador: 0, mentor: 0, aprendiz: 0, total: 0 };
    for (const fila of filas) {
      if (fila._id in resumen) resumen[fila._id] = fila.total;
      resumen.total += fila.total;
    }
    return resumen;
  }

  async buscarPorId(id) {
    return Usuario.findById(id).select(PROYECCION_SEGURA);
  }

  async actualizar(id, cambios) {
    return Usuario.findByIdAndUpdate(id, cambios, {
      new: true,
      runValidators: true,
    }).select(PROYECCION_SEGURA);
  }

  async fechasRegistro() {
    return Usuario.find({}, { createdAt: 1 }).lean();
  }
}

export default new UsuarioRepository();
