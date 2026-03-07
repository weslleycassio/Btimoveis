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

export const updateMinhaSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmarNovaSenha: z.string().min(1, 'Confirmação da nova senha é obrigatória'),
});

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UpdateMeuUsuarioInput = z.infer<typeof updateMeuUsuarioSchema>;
export type UpdateMinhaSenhaInput = z.infer<typeof updateMinhaSenhaSchema>;
