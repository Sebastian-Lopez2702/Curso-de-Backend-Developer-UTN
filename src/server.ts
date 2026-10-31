import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { runSeeder } from './config/seeder';
import { app } from './app';

const start = async (): Promise<void> => {
  await connectDB();
  await runSeeder();
  app.listen(env.port, () => {
    logger.info(`Servidor escuchando en el puerto ${env.port}`);
  });
};

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});
