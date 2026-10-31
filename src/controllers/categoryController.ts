import { Request, Response } from 'express';
import { sendError } from '../middleware/errorHandler';
import { Category } from '../models/category';
import { CategoryService } from '../services/categoryService';
import { successResponse } from '../utils/apiResponse';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryService.getAll();
      res.status(200).json(successResponse(categories.map((category) => this.toResponse(category))));
    } catch (err) {
      sendError(res, err);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = await this.categoryService.create(req.body ?? {});
      res.status(201).json(successResponse(this.toResponse(category), 'Categoría creada correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.categoryService.delete(req.params.id);
      res.status(200).json(successResponse(null, 'Categoría eliminada correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  private toResponse(category: Category) {
    return {
      id: category.getId(),
      name: category.getName(),
      description: category.getDescription(),
    };
  }
}
