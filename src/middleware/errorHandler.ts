import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { errorResponse } from "../utils/apiResponse";
import { toHttpError } from "./errorMappers";

export const sendError = (res: Response, err: unknown): void => {
  const httpError = toHttpError(err);

  if (!httpError.isExpected) {
    logger.error(err instanceof Error ? err : new Error(String(err)));
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
