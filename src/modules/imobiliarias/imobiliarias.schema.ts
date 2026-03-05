import { z } from 'zod';

export const createImobiliariaSchema = z.object({
  imobiliaria: z.object({
    nome: z.string().min(1),
    telefone: z.string().min(8),
    email: z.string().email().optional(),
    cnpj: z.string().optional(),
  }),
  admin: z.object({
    nome: z.string().min(1),
    telefone: z.string().min(8),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  returnToken: z.boolean().optional().default(true),
});

export type CreateImobiliariaInput = z.infer<typeof createImobiliariaSchema>;
