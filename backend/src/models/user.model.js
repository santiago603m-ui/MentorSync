import { Schema, model } from 'mongoose';

/**
 * Modelo de Usuario.
 * Ver docs/04_DATABASE_SCHEMA.md para la referencia completa de la colección.
 */
const esquemaUsuario = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contraseñaHash: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false, // nunca se trae por defecto en un find()
    },
    rol: {
      type: String,
      enum: ['aprendiz', 'mentor', 'administrador'],
      default: 'aprendiz',
      required: true,
    },
    perfilMentor: {
      type: new Schema(
        {
          bio: { type: String, default: '', trim: true },
          especialidad: { type: String, default: '', trim: true },
          verificado: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: undefined, // así los aprendices NO cargan este subdocumento en absoluto
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model('Usuario', esquemaUsuario);
