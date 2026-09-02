import { z } from 'zod';

export const esquemaPregunta = z.object({
  pregunta: z
    .string()
    .trim()
    .min(3, 'La pregunta debe tener al menos 3 caracteres')
    .max(1000, 'La pregunta no puede superar 1000 caracteres'),
  threadId: z.string().uuid('threadId inválido').optional(),
});