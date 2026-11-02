import { Request, Response } from 'express';
import { AuthenticationError } from '../errors/DomainErrors';
import { sendError } from '../middleware/errorHandler';
import { Product } from '../models/product';
import { ProductService } from '../services/productService';
import { successResponse } from '../utils/apiResponse';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = await this.productService.getAll({
        page: this.parseNumber(req.query.page),
        limit: this.parseNumber(req.query.limit),
        categoryId: this.parseText(req.query.category),
        searchText: this.parseText(req.query.q),
      });

      const items = page.items.map((product) => this.toResponse(product));
      const meta = { page: page.page, limit: page.limit, total: page.total, totalPages: page.totalPages };
      res.status(200).json(successResponse(items, undefined, meta));
    } catch (err) {
      sendError(res, err);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await this.productService.getActiveById(req.params.id);
      res.status(200).json(successResponse(this.toResponse(product)));
    } catch (err) {
      sendError(res, err);
    }
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = this.getAuthenticatedSellerId(req);
      const products = await this.productService.getBySeller(sellerId);
      res.status(200).json(successResponse(products.map((product) => this.toResponse(product))));
    } catch (err) {
      sendError(res, err);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = this.getAuthenticatedSellerId(req);
      const product = await this.productService.create(req.body ?? {}, sellerId);
      res.status(201).json(successResponse(this.toResponse(product), 'Producto creado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = this.getAuthenticatedSellerId(req);
      const product = await this.productService.update(req.params.id, req.body ?? {}, sellerId);
      res.status(200).json(successResponse(this.toResponse(product), 'Producto actualizado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = this.getAuthenticatedSellerId(req);
      await this.productService.delete(req.params.id, sellerId);
      res.status(200).json(successResponse(null, 'Producto eliminado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  private getAuthenticatedSellerId(req: Request): string {
    if (req.user === undefined) {
      throw new AuthenticationError();
    }
    return req.user.userId;
  }

  private parseNumber(value: unknown): number | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) return undefined;
    return Number(value);
  }

  private parseText(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    return value;
  }

  private toResponse(product: Product) {
    const category = product.getCategory();
    let categoryResponse = null;
    if (category !== undefined) {
      categoryResponse = {
        id: category.getId(),
        name: category.getName(),
        description: category.getDescription(),
      };
    }

    return {
      id: product.getId(),
      sku: product.getSku(),
      name: product.getName(),
      description: product.getDescription(),
      salePrice: product.getSalePrice(),
      stock: product.getStock(),
      isActive: product.getIsActive(),
      sellerId: product.getSellerId(),
      categoryId: product.getCategoryId(),
      category: categoryResponse,
    };
  }
}
