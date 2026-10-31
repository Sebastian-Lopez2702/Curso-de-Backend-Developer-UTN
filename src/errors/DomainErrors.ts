export interface ErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  public readonly details: Record<string, string> = {};

  constructor(errors: ErrorDetail[]) {
    super('Error de validación');
    this.name = 'ValidationError';
    for (const error of errors) {
      this.details[error.field] = error.message;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'No autenticado') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotAllowedError extends Error {
  constructor(message = 'No tenés permisos para realizar esta acción') {
    super(message);
    this.name = 'NotAllowedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message = 'Recurso no encontrado') {
    super(message);
    this.name = 'ResourceNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends Error {
  constructor(message = 'La operación entra en conflicto con el estado actual del recurso') {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
