import winston from 'winston';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'secret']);

const redactSensitiveData = winston.format((info) => {
  const sanitize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        cleaned[key] = sanitize(val);
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  };

  return sanitize(info);
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    silent: isTest,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${stack ?? message}${metaStr}`;
      }),
    ),
  }),
];

if (!isProd && !isTest) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactSensitiveData(),
    winston.format.json(),
  ),
  transports,
});
