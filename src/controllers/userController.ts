import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { AuthenticationError } from '../errors/DomainErrors';
import { sendError } from '../middleware/errorHandler';
import { User } from '../models/user';
import { UserService } from '../services/userService';
import { successResponse } from '../utils/apiResponse';

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Intento de registro de usuario', {
        email: req.body?.email,
        role: req.body?.role,
      });
      const user = await this.userService.register(req.body ?? {});
      logger.info('Usuario registrado exitosamente', {
        userId: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      });
      res.status(201).json(successResponse(this.toResponse(user), 'Usuario registrado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Intento de inicio de sesión', { email: req.body?.email });
      const { token, user } = await this.userService.login(req.body ?? {});
      logger.info('Inicio de sesión exitoso', {
        userId: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      });
      res.status(200).json(successResponse({ token, user: this.toResponse(user) }, 'Login exitoso'));
    } catch (err) {
      sendError(res, err);
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const user = await this.userService.getProfile(userId);
      logger.info('Perfil de usuario consultado', { userId });
      res.status(200).json(successResponse(this.toResponse(user)));
    } catch (err) {
      sendError(res, err);
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAll();
      logger.info('Listado global de usuarios consultado por ADMIN', {
        adminId: req.user?.userId,
        total: users.length,
      });
      res.status(200).json(successResponse(users.map((user) => this.toResponse(user))));
    } catch (err) {
      sendError(res, err);
    }
  };

  private getAuthenticatedUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AuthenticationError();
    }
    return userId;
  }

  private toResponse(user: User) {
    return {
      id: user.getId(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      dni: user.getDni(),
      email: user.getEmail(),
      phone: user.getPhone(),
      role: user.getRole(),
    };
  }
}
