import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { sendError } from '../middleware/errorHandler';
import { Province } from '../models/province';
import { ProvinceService } from '../services/provinceService';
import { successResponse } from '../utils/apiResponse';

export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const provinces = await this.provinceService.getAll();
      logger.info('Listado de provincias consultado', {
        total: provinces.length,
      });
      res.status(200).json(successResponse(provinces.map((province) => this.toResponse(province))));
    } catch (err) {
      sendError(res, err);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const province = await this.provinceService.updateShippingCost(req.params.id, req.body ?? {});
      logger.info('Costo de envío de provincia actualizado por ADMIN', {
        adminId: req.user?.userId,
        provinceId: province.getId(),
        shippingCost: province.getShippingCost(),
      });
      res.status(200).json(successResponse(this.toResponse(province), 'Costo de envío actualizado correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  private toResponse(province: Province) {
    return {
      id: province.getId(),
      name: province.getName(),
      shippingCost: province.getShippingCost(),
    };
  }
}
