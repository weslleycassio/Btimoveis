import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const usuarioIdParamSchema = z.object({
  id: z.string().refine((value) => z.string().cuid().safeParse(value).success || z.string().uuid().safeParse(value).success, {
    message: 'ID inválido',
  }),
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

export const updateMeuUsuarioSchema = z
  .object({
    nome: z.string().min(2).optional(),
    email: z.string().email().optional(),
    telefone: z.string().min(8).optional(),
  })
  .strict({ message: 'Há campos não permitidos para atualização' })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UpdateMeuUsuarioInput = z.infer<typeof updateMeuUsuarioSchema>;
