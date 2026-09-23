import { z } from 'zod';

export const esquemaCrearSesion = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de curso inválido'),
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(120),
  fechaInicioProgramada: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
  urlReunion: z.string().url('URL no válida').optional().or(z.literal('')),
});

export const esquemaCambiarEstadoSesion = z.object({
  estado: z.enum(['programada', 'en_curso', 'finalizada', 'cancelada'], {
    error: () => 'Estado inválido. Usa programada, en_curso, finalizada o cancelada',
  }),
});

export const esquemaMensajeSala = z.object({
  liveSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de sesión inválido'),
  contenido: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(2000),
});
