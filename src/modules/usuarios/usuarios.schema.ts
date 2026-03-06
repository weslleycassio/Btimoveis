import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const usuarioIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const updateUsuarioSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    telefone: z.string().min(8).optional(),
    ativo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
