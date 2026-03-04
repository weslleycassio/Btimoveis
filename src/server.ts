import { app } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';
import { ensureBucketExists } from './shared/storage/minio.storage';

let server: ReturnType<typeof app.listen>;

async function bootstrap(): Promise<void> {
  await ensureBucketExists();

  server = app.listen(env.PORT, () => {
    console.log(`Servidor rodando na porta ${env.PORT}`);
  });
}

void bootstrap();

async function shutdown(signal: string): Promise<void> {
  console.log(`Recebido ${signal}. Encerrando aplicação...`);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    return;
  }

  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
