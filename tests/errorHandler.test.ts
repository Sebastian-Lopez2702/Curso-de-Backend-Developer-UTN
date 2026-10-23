import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  AppError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from "../src/errors/AppError";
import { normalizeError } from "../src/middleware/errorMappers";
import { errorHandler, notFoundHandler } from "../src/middleware/errorHandler";
import { logger } from "../src/config/logger";

describe("AppError y subclases semánticas", () => {
  it("debería instanciar la clase base AppError con los valores por defecto", () => {
    const error = new AppError(418, "prueba", { detail: "extra" });
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe("prueba");
    expect(error.isOperational).toBe(true);
    expect(error.details).toEqual({ detail: "extra" });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("debería instanciar BadRequestError con código de estado 400", () => {
    const error = new BadRequestError("Dato inválido", { field: "email" });
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Dato inválido");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(BadRequestError);
  });

  it("debería instanciar UnauthorizedError con código de estado 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("No autorizado");
    expect(error).toBeInstanceOf(AppError);
  });

  it("debería instanciar ForbiddenError con código de estado 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Acceso prohibido");
  });

  it("debería instanciar NotFoundError con código de estado 404", () => {
    const error = new NotFoundError("Usuario no encontrado");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Usuario no encontrado");
  });

  it("debería instanciar ConflictError con código de estado 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe("Conflicto con el recurso");
  });

  it("debería instanciar InternalServerError con código 500 y isOperational en false", () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });
});

describe("normalizeError (Mapeo de errores externos)", () => {
  it("debería devolver la misma instancia si el error ya es un AppError", () => {
    const custom = new NotFoundError("Not found");
    const normalized = normalizeError(custom);
    expect(normalized).toBe(custom);
  });

  it("debería mapear un ValidationError de Mongoose a BadRequestError (400)", () => {
    const validationError = new mongoose.Error.ValidationError();
    const normalized = normalizeError(validationError);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toBe("Error de validación");
  });

  it("debería mapear un CastError de Mongoose a BadRequestError (400)", () => {
    const castError = new mongoose.Error.CastError("ObjectId", "invalid-id", "_id");
    const normalized = normalizeError(castError);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toBe("Valor inválido para el campo '_id'");
  });

  it("debería mapear el error de clave duplicada (código 11000) de MongoDB a BadRequestError (400)", () => {
    const duplicateError = { code: 11000, message: "E11000 duplicate key" };
    const normalized = normalizeError(duplicateError);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toBe("Valor duplicado: ya existe un registro con esos datos");
  });

  it("debería mapear un error de análisis de JSON inválido a BadRequestError (400)", () => {
    const parseError = { type: "entity.parse.failed" };
    const normalized = normalizeError(parseError);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toBe("JSON inválido en el cuerpo de la petición");
  });

  it("debería mapear errores desconocidos o genéricos a InternalServerError (500)", () => {
    const randomError = new Error("Database connection dropped unexpectedly");
    const normalized = normalizeError(randomError);
    expect(normalized.statusCode).toBe(500);
    expect(normalized.isOperational).toBe(false);
    expect(normalized.message).toBe("Error interno del servidor");
  });
});

describe("Middleware errorHandler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = { method: "GET", originalUrl: "/test" };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it("debería manejar errores operacionales de AppError sin registrar la traza en el logger", () => {
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation();
    const appError = new NotFoundError("Elemento no encontrado");

    errorHandler(appError, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Elemento no encontrado",
      error: undefined,
    });
    expect(loggerSpy).not.toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it("debería registrar en el logger los errores no operacionales e inesperados y responder con status 500", () => {
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation();
    const unexpectedError = new Error("Critical crash");

    errorHandler(unexpectedError, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Error interno del servidor",
      error: undefined,
    });
    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it("notFoundHandler debería responder con status 404 e indicar la ruta solicitada", () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Ruta no encontrada: GET /test",
      error: undefined,
    });
  });
});
