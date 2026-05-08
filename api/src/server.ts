import 'express';
import { env } from './config/env.config';
import { prisma } from './config/prisma.config';
import app from './app';
import logger from './utils/logger';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down gracefully');

      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
