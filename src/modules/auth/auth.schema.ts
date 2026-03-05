import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default(UserRole.CORRETOR),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
