export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Solicitud inválida", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado", details?: unknown) {
    super(401, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso prohibido", details?: unknown) {
    super(403, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado", details?: unknown) {
    super(404, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto con el recurso", details?: unknown) {
    super(409, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Error interno del servidor", details?: unknown) {
    super(500, message, details, false);
  }
}
