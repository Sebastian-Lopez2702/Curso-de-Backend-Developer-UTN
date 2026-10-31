import { Request, Response } from 'express';
import { JwtPayload } from '../interfaces/auth';
import { sendError } from '../middleware/errorHandler';
import { User } from '../models/user';
import { UserService } from '../services/userService';
import { successResponse } from '../utils/apiResponse';

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.register(req.body ?? {});
      res.status(201).json(successResponse(this.toResponse(user), 'Usuario registrado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, user } = await this.userService.login(req.body ?? {});
      res.status(200).json(successResponse({ token, user: this.toResponse(user) }, 'Login exitoso'));
    } catch (err) {
      sendError(res, err);
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.user as JwtPayload;
      const user = await this.userService.getProfile(userId);
      res.status(200).json(successResponse(this.toResponse(user)));
    } catch (err) {
      sendError(res, err);
    }
  };

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAll();
      res.status(200).json(successResponse(users.map((user) => this.toResponse(user))));
    } catch (err) {
      sendError(res, err);
    }
  };

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
