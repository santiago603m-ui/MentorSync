import Usuario from '../models/user.model.js';

class AuthRepository {
  async buscarPorEmail(email) {
    return Usuario.findOne({ email });
  }

  // contraseñaHash tiene select:false en el schema, hay que pedirlo explícito
  async buscarPorEmailConContraseña(email) {
    return Usuario.findOne({ email, activo: true }).select('+contraseñaHash');
  }

  async crear(datosUsuario) {
    const usuario = new Usuario(datosUsuario);
    return usuario.save();
  }
}

export default new AuthRepository();