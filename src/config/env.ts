import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'PORT',
  'MONGO_URL',
  'BCRIPT_ROUNDS',
  'JWT_SECRET',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
  'INITIAL_ADMIN_DNI',
] as const;

const missing = REQUIRED_VARS.filter((name) => {
  if (name === 'BCRIPT_ROUNDS') {
    return !process.env.BCRIPT_ROUNDS && !process.env.BYCRIPT_ROUNDS;
  }
  if (name === 'MONGO_URL') {
    return !process.env.MONGO_URL && !process.env.MONGO_URI;
  }
  return !process.env[name];
});

if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
}

export const env = {
  port: Number(process.env.PORT),
  mongoUri: (process.env.MONGO_URL || process.env.MONGO_URI) as string,
  bcryptRounds: Number(process.env.BCRIPT_ROUNDS ?? process.env.BYCRIPT_ROUNDS ?? 10),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL as string,
    password: process.env.INITIAL_ADMIN_PASSWORD as string,
    dni: process.env.INITIAL_ADMIN_DNI as string,
  },
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
