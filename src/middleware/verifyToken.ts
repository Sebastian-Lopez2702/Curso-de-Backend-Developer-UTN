import { NextFunction, Request, Response } from 'express';
import { AuthenticationError, NotAllowedError } from '../errors/DomainErrors';
import { UserRole } from '../models/user';
import { decodeToken } from '../utils/jwt';
import { sendError } from './errorHandler';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, new AuthenticationError('Token no proporcionado'));
  }

  try {
    req.user = decodeToken(header.slice(7));
  } catch {
    return sendError(res, new AuthenticationError('Token inválido o expirado'));
  }

  next();
};

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendError(res, new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, new NotAllowedError());
    }
    next();
  };
