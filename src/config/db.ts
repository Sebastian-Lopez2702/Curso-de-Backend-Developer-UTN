import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  logger.info('Conexión a MongoDB establecida');
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
