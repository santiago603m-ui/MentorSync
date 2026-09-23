import { z } from 'zod';

const ROLES_VALIDOS = ['aprendiz', 'mentor', 'administrador'];

export const esquemaCambiarRol = z.object({
  rol: z.enum(ROLES_VALIDOS, {
    error: () => 'Rol inválido. Usa aprendiz, mentor o administrador',
  }),
});

export const esquemaCambiarEstado = z.object({
  activo: z.boolean({ error: () => 'El campo activo debe ser verdadero o falso' }),
});

// Creación de usuarios por un administrador (incluye administradores).
// Reutiliza los mismos límites del registro público.
export const esquemaCrearUsuario = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().trim().toLowerCase().email('El correo no tiene un formato válido'),
  contraseña: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  rol: z.enum(ROLES_VALIDOS, {
    error: () => 'Rol inválido. Usa aprendiz, mentor o administrador',
  }),
});
