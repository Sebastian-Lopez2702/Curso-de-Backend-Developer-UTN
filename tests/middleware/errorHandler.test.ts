import { Request, Response } from "express";
import { logger } from "../../src/config/logger";
import {
  AuthenticationError,
  NotAllowedError,
  ResourceNotFoundError,
  ValidationError,
} from "../../src/errors/DomainErrors";
import { errorHandler, notFoundHandler, sendError } from "../../src/middleware/errorHandler";
import { toHttpError } from "../../src/middleware/errorMappers";

describe("toHttpError - Traducción de errores a HTTP", () => {
  it("Debería traducir ValidationError a 400 con sus detalles", () => {
    const result = toHttpError(new ValidationError([{ field: "email", message: "inválido" }]));
    expect(result).toMatchObject({ statusCode: 400, details: { email: "inválido" }, isExpected: true });
  });

  it("Debería traducir AuthenticationError a 401", () => {
    expect(toHttpError(new AuthenticationError()).statusCode).toBe(401);
  });

  it("Debería traducir NotAllowedError a 403", () => {
    expect(toHttpError(new NotAllowedError()).statusCode).toBe(403);
  });

  it("Debería traducir ResourceNotFoundError a 404", () => {
    expect(toHttpError(new ResourceNotFoundError()).statusCode).toBe(404);
  });

  it("Debería traducir un JSON malformado a 400", () => {
    expect(toHttpError({ type: "entity.parse.failed" }).statusCode).toBe(400);
  });

  it("Debería traducir cualquier otro error a 500 inesperado", () => {
    const result = toHttpError(new Error("fallo"));
    expect(result).toMatchObject({ statusCode: 500, message: "Error interno del servidor", isExpected: false });
  });
});

describe("Respuestas de error", () => {
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock };
  });

  it("sendError debería responder con el código del error esperado sin registrarlo en el logger", () => {
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation();
    sendError(res as Response, new ResourceNotFoundError("No existe"));

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "No existe", error: undefined });
    expect(loggerSpy).not.toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it("sendError debería registrar en el logger los errores inesperados y responder 500", () => {
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation();
    sendError(res as Response, new Error("crash"));

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it("errorHandler debería responder igual que sendError", () => {
    errorHandler(new AuthenticationError("sin sesión"), {} as Request, res as Response, jest.fn());
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("notFoundHandler debería responder 404 e indicar la ruta solicitada", () => {
    notFoundHandler({ method: "GET", originalUrl: "/test" } as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Ruta no encontrada: GET /test",
      error: undefined,
    });
  });
});
