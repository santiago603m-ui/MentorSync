import { z } from 'zod';

export const esquemaCrearCurso = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede superar 120 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres'),
  categoria: z.string().trim().min(2).max(60),
  precio: z.number().nonnegative('El precio no puede ser negativo').optional(),
  duracionEstimadaHoras: z
    .number()
    .nonnegative('La duración no puede ser negativa')
    .optional(),
});

// Todos los campos opcionales para actualizaciones parciales (PATCH)
export const esquemaActualizarCurso = esquemaCrearCurso.partial();

export const esquemaCambiarEstado = z.object({
  // Zod v4 renombró la opción de mensaje custom de `errorMap` a `error`.
  estado: z.enum(['borrador', 'publicado', 'archivado'], {
    error: () => 'Estado inválido',
  }),
});