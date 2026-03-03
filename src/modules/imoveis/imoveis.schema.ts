import { ImovelStatus } from '@prisma/client';
import { z } from 'zod';

const imovelBaseFieldsSchema = z.object({
  titulo: z.string().min(1),
  tipo: z.string().min(1),
  finalidade: z.string().min(1),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  preco: z.coerce.number().positive(),
  descricao: z.string().optional(),
  status: z.nativeEnum(ImovelStatus).optional(),
  corretorCaptadorId: z.string().min(1).optional(),
});

export const createImovelSchema = imovelBaseFieldsSchema;

export const updateImovelSchema = imovelBaseFieldsSchema.partial().extend({
  motivoEdicao: z.string().trim().min(3).max(255),
});

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
