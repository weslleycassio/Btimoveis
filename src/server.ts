import { env } from './config/env';
import { prisma } from './db/prisma';
import { app } from './app';

const server = app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Recebido ${signal}. Encerrando aplicação...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
