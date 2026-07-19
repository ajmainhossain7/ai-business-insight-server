import mongoose from 'mongoose';
import { logger } from '../utils/logger.utils';

// ============================================================
// MongoDB Database Configuration
// ============================================================
// TODO: Set MONGODB_URI in your .env file
// Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
// Get a free cluster at https://cloud.mongodb.com/
// ============================================================

const MONGODB_OPTIONS: mongoose.ConnectOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    // TODO: Remove this warning once MONGODB_URI is configured
    logger.warn('⚠️  MONGODB_URI not set. Database features will not work.');
    logger.warn('    Set MONGODB_URI in your .env file to enable database connection.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, MONGODB_OPTIONS);
    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    // Don't exit — let the app run without DB for development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

export { mongoose };
