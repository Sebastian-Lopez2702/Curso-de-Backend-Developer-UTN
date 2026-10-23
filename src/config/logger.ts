import winston from "winston";

const isProd = process.env.NODE_ENV === "prod";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      silent: isProd,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => `${timestamp} [${level}] ${stack ?? message}`),
      ),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error", silent: isProd }),
    new winston.transports.File({ filename: "logs/combined.log", silent: isProd }),
  ],
});
