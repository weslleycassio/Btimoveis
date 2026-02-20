import { ImovelStatus } from '@prisma/client';
import { z } from 'zod';

export const createImovelSchema = z.object({
  titulo: z.string().min(1),
  tipo: z.string().min(1),
  finalidade: z.string().min(1),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  preco: z.coerce.number().positive(),
  descricao: z.string().optional(),
  status: z.nativeEnum(ImovelStatus).optional(),
});

export const updateImovelSchema = createImovelSchema.partial();

export const listImoveisQuerySchema = z.object({
  tipo: z.string().optional(),
  finalidade: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  status: z.nativeEnum(ImovelStatus).optional(),
  minPreco: z.coerce.number().nonnegative().optional(),
  maxPreco: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateImovelInput = z.infer<typeof createImovelSchema>;
export type UpdateImovelInput = z.infer<typeof updateImovelSchema>;
export type ListImoveisQuery = z.infer<typeof listImoveisQuerySchema>;
