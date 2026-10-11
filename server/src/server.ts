import { createServer } from 'http';
import { app } from './app.js';
import config from './app/config/index.js';
import { prisma } from './app/shared/prisma.js';

const shutdown = (server: ReturnType<typeof createServer>, signal: string): void => {
  console.log(`${signal} received: closing server gracefully`);
  server.close(() => {
    void prisma
      .$disconnect()
      .catch((err: unknown) => console.error('Prisma disconnect error:', err))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

const bootstrap = async (): Promise<void> => {
  await prisma.$connect();
  console.log('Database connected');

  const server = createServer(app);
  server.listen(config.PORT, () => {
    console.log(`🚀 BagherHat Poultry API listening on port ${config.PORT} [${config.NODE_ENV}]`);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown(server, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown(server, 'uncaughtException');
  });
  process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
  process.on('SIGINT', () => shutdown(server, 'SIGINT'));
};

void bootstrap().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
