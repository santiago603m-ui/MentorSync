import { z } from 'zod';

/**
 * Esquemas de validación para autenticación.
 * Ver docs/03_BACKEND_GUIDELINES.md — todo req.body pasa por aquí antes
 * de llegar al service; el service nunca valida datos crudos.
 */

export const esquemaRegistro = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),

  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),

  contraseña: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'), // bcrypt trunca a 72 bytes

  rol: z.enum(['aprendiz', 'mentor', 'administrador']).optional(),

  perfilMentor: z
    .object({
      bio: z.string().max(500).optional(),
      especialidad: z.string().max(100).optional(),
    })
    .optional(),
});

export const esquemaInicioSesion = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),

  contraseña: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});
