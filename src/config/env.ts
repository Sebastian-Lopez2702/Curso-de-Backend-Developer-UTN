import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'PORT',
  'MONGO_URI',
  'BYCRIPT_ROUNDS',
  'JWT_SECRET',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
  'INITIAL_ADMIN_DNI',
] as const;

const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
}

export const env = {
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI as string,
  bycryptRounds: Number(process.env.BYCRIPT_ROUNDS),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL as string,
    password: process.env.INITIAL_ADMIN_PASSWORD as string,
    dni: process.env.INITIAL_ADMIN_DNI as string,
  },
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
