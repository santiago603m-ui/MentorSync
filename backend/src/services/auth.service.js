import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

class AuthService {

    async register(userData) {
        const {
            nombre,
            email,
            password,
            contraseña,
            rol,
            perfilMentor } = userData;

        const passToHash = password || contraseña;

        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            throw new Error("El Correo Ya Se Encuentra Registrado");
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passToHash, salt);

        const mentorProfileData = rol === 'mentor' ? {
            bio: perfilMentor?.bio || '',
            especialidad: perfilMentor?.especialidad || '',
            verificado: false
        } : undefined;

        const nuevoUsuario = new User({
            nombre,
            email,
            passwordHash,
            rol: rol || 'aprendiz',
            perfilMentor: mentorProfileData
        });

        await nuevoUsuario.save();

        const response = nuevoUsuario.toObject();
        delete response.passwordHash;
        return response;
    }

    async login(credenciales) {
        const { email, password, contraseña } = credenciales;
        const passToCheck = password || contraseña;

        const user = await User.findOne({
            email, isActive: true
        });

        if (!user) {
            throw new Error("Credenciales Invalidas o Cuenta Inactiva");
        }
        const esValida = await bcrypt.compare(passToCheck, user.passwordHash);
        if (!esValida) {
            throw new Error('Credenciales Invalidas');
        }

        const payload = {
            id: user._id,
            rol: user.rol,
            email: user.email
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        const userResponse = user.toObject();
        delete userResponse.passwordHash;

        return {
            token,
            user: userResponse
        };
    }
}

export default new AuthService();