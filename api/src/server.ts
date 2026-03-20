import 'express';
import { env } from './config/env.config';
import { prisma } from './config/prisma.config';
import app from './app';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✓ Database connected');

    const server = app.listen(env.PORT, () => {
      console.log(`✓ Server running on http://localhost:${env.PORT}`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(async () => {
        await prisma.$disconnect();
        console.log('✓ Database disconnected');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
