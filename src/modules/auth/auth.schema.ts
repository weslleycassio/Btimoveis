import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const userRoleSchema = z.nativeEnum(UserRole);

export const registerSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
