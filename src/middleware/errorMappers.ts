import mongoose from "mongoose";
import { AppError, BadRequestError, InternalServerError } from "../errors/AppError";

interface CustomError {
  code?: number;
  type?: string;
  message?: string;
}

export const normalizeError = (err: unknown): AppError => {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return new BadRequestError("Error de validación", err.errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new BadRequestError(`Valor inválido para el campo '${err.path}'`);
  }

  const customErr = err as CustomError;

  if (customErr?.code === 11000) {
    return new BadRequestError("Valor duplicado: ya existe un registro con esos datos");
  }

  if (customErr?.type === "entity.parse.failed") {
    return new BadRequestError("JSON inválido en el cuerpo de la petición");
  }

  return new InternalServerError("Error interno del servidor");
};
