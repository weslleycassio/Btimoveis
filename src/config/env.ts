import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro ao validar variáveis de ambiente:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
