import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['aprendiz', 'mentor', 'administrador'], 
    default: 'aprendiz',
    required: true 
  },
  perfilMentor: {
    bio: { type: String, default: '' },
    especialidad: { type: String, default: '' },
    verificado: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model('User', userSchema);