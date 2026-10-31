import {
  AuthenticationError,
  ConflictError,
  NotAllowedError,
  ResourceNotFoundError,
  ValidationError,
} from '../errors/DomainErrors';

export interface HttpError {
  statusCode: number;
  message: string;
  details?: unknown;
  isExpected: boolean;
}

interface BodyParserError {
  type?: string;
}

export const toHttpError = (err: unknown): HttpError => {
  if (err instanceof ValidationError) {
    return { statusCode: 400, message: err.message, details: err.details, isExpected: true };
  }
  if (err instanceof AuthenticationError) {
    return { statusCode: 401, message: err.message, isExpected: true };
  }
  if (err instanceof NotAllowedError) {
    return { statusCode: 403, message: err.message, isExpected: true };
  }
  if (err instanceof ResourceNotFoundError) {
    return { statusCode: 404, message: err.message, isExpected: true };
  }
  if (err instanceof ConflictError) {
    return { statusCode: 409, message: err.message, isExpected: true };
  }
  if ((err as BodyParserError)?.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'JSON inválido en el cuerpo de la petición', isExpected: true };
  }
  return { statusCode: 500, message: 'Error interno del servidor', isExpected: false };
};
