import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from '../repositories/auth.repository.js';
import { AppError } from '../utils/AppError.js';

const RONDAS_SALT = 10;

/**
 * Genera el hash de una contraseña en texto plano.
 */
async function hashearContraseña(contraseña) {
  const salt = await bcrypt.genSalt(RONDAS_SALT);
  return bcrypt.hash(contraseña, salt);
}

/**
 * Genera el JWT de sesión para un usuario ya autenticado.
 */
function generarToken(usuario) {
  const payload = {
    id: usuario._id,
    rol: usuario.rol,
    email: usuario.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Quita campos sensibles/internos antes de devolver el usuario al cliente.
 */
function serializarUsuario(usuarioDoc) {
  const usuario = usuarioDoc.toObject();
  delete usuario.contraseñaHash;
  delete usuario.__v;
  return usuario;
}

class AuthService {
  /**
   * Registra un nuevo usuario.
   * @param {object} datos - ya validado por esquemaRegistro (validators/auth.validator.js)
   */
  async registrar(datos) {
    const { nombre, email, contraseña, rol, perfilMentor } = datos;

    const usuarioExistente = await authRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      // El tercer argumento (code) es opcional: si tu AppError actual no lo
      // soporta todavía, JS simplemente lo ignora — no rompe nada.
      throw new AppError('El correo ya se encuentra registrado', 409, 'EMAIL_DUPLICADO');
    }

    const contraseñaHash = await hashearContraseña(contraseña);
    const esMentor = rol === 'mentor';

    const nuevoUsuario = await authRepository.crear({
      nombre,
      email,
      contraseñaHash,
      rol: rol || 'aprendiz',
      perfilMentor: esMentor
        ? {
            bio: perfilMentor?.bio || '',
            especialidad: perfilMentor?.especialidad || '',
            verificado: false,
          }
        : undefined,
    });

    return serializarUsuario(nuevoUsuario);
  }

  /**
   * Valida credenciales y devuelve token + usuario.
   * @param {object} credenciales - ya validado por esquemaInicioSesion
   */
  async iniciarSesion(credenciales) {
    const { email, contraseña } = credenciales;

    const usuario = await authRepository.buscarPorEmailConContraseña(email);

    // Mismo mensaje tanto si el usuario no existe como si la contraseña
    // es incorrecta — evita que un atacante confirme qué correos existen.
    const credencialesInvalidas = () =>
      new AppError('Correo o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');

    if (!usuario) {
      throw credencialesInvalidas();
    }

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseñaHash);
    if (!contraseñaValida) {
      throw credencialesInvalidas();
    }

    const token = generarToken(usuario);

    return {
      token,
      usuario: serializarUsuario(usuario),
    };
  }
}

export default new AuthService();