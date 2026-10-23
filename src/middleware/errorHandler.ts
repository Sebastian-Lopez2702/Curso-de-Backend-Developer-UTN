import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { errorResponse } from "../utils/apiResponse";
import { normalizeError } from "./errorMappers";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  const appError = normalizeError(err);

  if (!appError.isOperational) {
    logger.error(err instanceof Error ? err : new Error(String(err)));
  }

  res.status(appError.statusCode).json(errorResponse(appError.message, appError.details));
};
