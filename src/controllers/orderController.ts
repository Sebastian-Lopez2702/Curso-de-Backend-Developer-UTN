import { Request, Response } from 'express';
import { AuthenticationError } from '../errors/DomainErrors';
import { sendError } from '../middleware/errorHandler';
import { Order } from '../models/order';
import { OrderService } from '../services/orderService';
import { successResponse } from '../utils/apiResponse';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const cart = await this.orderService.getCart(userId);
      res.status(200).json(successResponse(this.toResponse(cart)));
    } catch (err) {
      sendError(res, err);
    }
  };

  addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const cart = await this.orderService.addToCart(userId, req.body ?? {});
      res.status(200).json(successResponse(this.toResponse(cart), 'Producto agregado al carrito'));
    } catch (err) {
      sendError(res, err);
    }
  };

  updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { productId } = req.params;
      const cart = await this.orderService.updateCartItemQuantity(userId, productId, req.body ?? {});
      res.status(200).json(successResponse(this.toResponse(cart), 'Cantidad actualizada correctamente'));
    } catch (err) {
      sendError(res, err);
    }
  };

  removeCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { productId } = req.params;
      const cart = await this.orderService.removeCartItem(userId, productId);
      res.status(200).json(successResponse(this.toResponse(cart), 'Producto eliminado del carrito'));
    } catch (err) {
      sendError(res, err);
    }
  };

  checkout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = req.params;
      const order = await this.orderService.checkout(userId, id, req.body ?? {});
      res.status(200).json(successResponse(this.toResponse(order), 'Checkout realizado con éxito'));
    } catch (err) {
      sendError(res, err);
    }
  };

  getMyOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const orders = await this.orderService.getMyOrders(userId);
      res.status(200).json(successResponse(orders.map((order) => this.toResponse(order))));
    } catch (err) {
      sendError(res, err);
    }
  };

  getSellerSales = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = this.getAuthenticatedUserId(req);
      const sales = await this.orderService.getSellerSales(sellerId);
      res.status(200).json(successResponse(sales));
    } catch (err) {
      sendError(res, err);
    }
  };

  getAllOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
      const orders = await this.orderService.getAllOrders();
      res.status(200).json(successResponse(orders.map((order) => this.toResponse(order))));
    } catch (err) {
      sendError(res, err);
    }
  };

  updateShipping = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await this.orderService.updateShippingStatus(id, req.body ?? {});
      res.status(200).json(successResponse(this.toResponse(order), 'Estado de envío actualizado con éxito'));
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

  private toResponse(order: Order) {
    return {
      id: order.getId() ?? null,
      userId: order.getUserId(),
      orderStatus: order.getOrderStatus(),
      items: order.getItems().map((item) => ({
        productId: item.getProductId(),
        quantity: item.getQuantity(),
        recordedSalePrice: item.getRecordedSalePrice(),
        sellerId: item.getSellerId(),
      })),
      invoice: order.getInvoice()
        ? {
            invoiceType: order.getInvoice()?.getInvoiceType(),
            subtotal: order.getInvoice()?.getSubtotal(),
            tax: order.getInvoice()?.getTax(),
            shippingCost: order.getInvoice()?.getShippingCost(),
            total: order.getInvoice()?.getTotal(),
            date: order.getInvoice()?.getDate(),
          }
        : undefined,
      shipping: order.getShipping()
        ? {
            address: order.getShipping()?.getAddress(),
            provinceId: order.getShipping()?.getProvinceId(),
            provinceName: order.getShipping()?.getProvinceName(),
            cost: order.getShipping()?.getCost(),
            trackingCode: order.getShipping()?.getTrackingCode(),
          }
        : undefined,
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    };
  }
}
