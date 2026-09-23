import usuarioRepository from '../repositories/user.repository.js';
import authRepository from '../repositories/auth.repository.js';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError.js';

const ROLES_VALIDOS = ['aprendiz', 'mentor', 'administrador'];
const RONDAS_SALT = 10;

class UsuarioService {
  async listarUsuarios({ rol, busqueda, pagina, limite }) {
    const paginaSegura = Math.max(1, Number(pagina) || 1);
    const limiteSeguro = Math.min(200, Math.max(1, Number(limite) || 100));

    if (rol && !ROLES_VALIDOS.includes(rol)) {
      throw new AppError('Rol inválido. Usa aprendiz, mentor o administrador', 400);
    }

    return usuarioRepository.listar({
      rol: rol || undefined,
      busqueda: (busqueda || '').trim() || undefined,
      pagina: paginaSegura,
      limite: limiteSeguro,
    });
  }

  async resumenRoles() {
    return usuarioRepository.contarPorRol();
  }

  async obtenerPorId(id) {
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return usuario;
  }

  // Creación de usuarios por un administrador. A diferencia del registro
  // público, aquí sí se puede asignar el rol administrador.
  async crearUsuario({ nombre, email, contraseña, rol }) {
    const existente = await authRepository.buscarPorEmail(email);
    if (existente) {
      throw new AppError('El correo ya se encuentra registrado', 409, 'EMAIL_DUPLICADO');
    }

    const salt = await bcrypt.genSalt(RONDAS_SALT);
    const contraseñaHash = await bcrypt.hash(contraseña, salt);

    const creado = await authRepository.crear({
      nombre,
      email,
      contraseñaHash,
      rol,
      perfilMentor: rol === 'mentor' ? { bio: '', especialidad: '', verificado: false } : undefined,
    });

    const usuario = creado.toObject();
    delete usuario.contraseñaHash;
    delete usuario.__v;
    return usuario;
  }

  async cambiarRol(id, nuevoRol, solicitanteId) {
    if (id === solicitanteId?.toString()) {
      throw new AppError('No puedes cambiar tu propio rol', 403);
    }

    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return usuarioRepository.actualizar(id, { rol: nuevoRol });
  }

  async cambiarEstado(id, activo, solicitanteId) {
    if (id === solicitanteId?.toString() && activo === false) {
      throw new AppError('No puedes desactivar tu propia cuenta', 403);
    }

    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return usuarioRepository.actualizar(id, { activo });
  }
}

export default new UsuarioService();
