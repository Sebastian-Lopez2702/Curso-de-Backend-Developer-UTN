import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { errorResponse } from '../utils/apiResponse';
import { toHttpError } from './errorMappers';

export const sendError = (res: Response, err: unknown): void => {
  const httpError = toHttpError(err);

  if (httpError.statusCode >= 500) {
    logger.error('Error interno del servidor (500)', {
      statusCode: httpError.statusCode,
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    });
  } else if (httpError.statusCode >= 400 && httpError.statusCode < 500) {
    logger.warn('Error en la solicitud del cliente (4xx)', {
      statusCode: httpError.statusCode,
      message: httpError.message,
      details: httpError.details,
    });
  }

  res.status(httpError.statusCode).json(errorResponse(httpError.message, httpError.details));
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  sendError(res, err);
};
