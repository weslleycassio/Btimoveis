import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('1d'),
  STORAGE_PROVIDER: z.enum(['minio']).default('minio'),
  MINIO_ENDPOINT: z.string().min(1).default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1).default('minio'),
  MINIO_SECRET_KEY: z.string().min(1).default('minio123'),
  MINIO_BUCKET: z.string().min(1).default('btimoveis'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro ao validar variáveis de ambiente:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
