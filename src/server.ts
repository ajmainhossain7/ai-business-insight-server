import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger.utils';

// ============================================================
// Server Entry Point
// ============================================================

const PORT = env.PORT;

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 AI Business Insight API running on http://localhost:${PORT}`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
      logger.info(`📁 Upload directory: ${env.UPLOAD_DIR}`);

      if (!process.env.MONGODB_URI) {
        logger.warn('⚠️  MONGODB_URI not set — database features unavailable');
      }
      if (!process.env.GEMINI_API_KEY) {
        logger.warn('⚠️  GEMINI_API_KEY not set — AI features will use mock data');
      }
      if (!process.env.GOOGLE_CLIENT_ID) {
        logger.warn('⚠️  GOOGLE_CLIENT_ID not set — Google OAuth unavailable');
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      if (env.NODE_ENV === 'production') process.exit(1);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
