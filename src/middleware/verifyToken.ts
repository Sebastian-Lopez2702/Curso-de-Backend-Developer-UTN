import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { AuthenticationError, NotAllowedError } from '../errors/DomainErrors';
import { UserRole } from '../models/user';
import { decodeToken } from '../utils/jwt';
import { sendError } from './errorHandler';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    logger.warn('Acceso denegado: Token no proporcionado', {
      method: req.method,
      path: req.originalUrl,
    });
    return sendError(res, new AuthenticationError('Token no proporcionado'));
  }

  try {
    req.user = decodeToken(header.slice(7));
  } catch {
    logger.warn('Acceso denegado: Token inválido o expirado', {
      method: req.method,
      path: req.originalUrl,
    });
    return sendError(res, new AuthenticationError('Token inválido o expirado'));
  }

  next();
};

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Acceso denegado: Usuario no autenticado en ruta restringida', {
        method: req.method,
        path: req.originalUrl,
      });
      return sendError(res, new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      logger.warn('Acceso denegado: Rol insuficiente para acceder al recurso', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        path: req.originalUrl,
      });
      return sendError(res, new NotAllowedError());
    }
    next();
  };
