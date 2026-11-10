import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { runSeeder } from './config/seeder';
import { app } from './app';

const start = async (): Promise<void> => {
  console.log(`[BOOT] Iniciando servidor en puerto ${env.port}...`);
  await connectDB();
  console.log('[BOOT] Conexión a MongoDB exitosa.');
  await runSeeder();
  console.log('[BOOT] Seeder inicial completado.');
  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`Servidor escuchando en el puerto ${env.port}`);
    console.log(`[BOOT] Servidor escuchando en el puerto ${env.port}`);
  });
};

start().catch((err) => {
  console.error('[FATAL BOOT ERROR]', err);
  logger.error(err);
  process.exit(1);
});
