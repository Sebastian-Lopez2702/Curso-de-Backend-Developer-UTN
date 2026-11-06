import { AddToCartDto } from '../dtos/addToCartDto';
import { ResourceNotFoundError, ValidationError } from '../errors/DomainErrors';
import { IOrderRepository } from '../interfaces/orderRepository';
import { IProductRepository } from '../interfaces/productRepository';
import { Order, OrderStatus } from '../models/order';
import { OrderErrorMessages } from '../models/error-menssages/orderErrorMessages';
import { isDuplicateKeyError } from '../utils/duplicateKey';

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
  ) { }

  public async getCart(userId: string): Promise<Order> {
    const cart = await this.orderRepository.findCartByUserId(userId);
    if (!cart) {
      return new Order({ userId, orderStatus: OrderStatus.CART, items: [] });
    }
    return cart;
  }

  public async addToCart(userId: string, dto: AddToCartDto): Promise<Order> {
    const { productId, quantity } = this.validateAddToCartDto(dto);

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ResourceNotFoundError('Producto no encontrado');
    }

    if (!product.getIsActive()) {
      throw new ValidationError([OrderErrorMessages.PRODUCT_INACTIVE()]);
    }

    let cart = await this.orderRepository.findCartByUserId(userId);
    if (!cart) {
      cart = new Order({ userId, orderStatus: OrderStatus.CART, items: [] });
    }

    cart.addItem({
      productId: product.getId()!,
      quantity,
      sellerId: product.getSellerId(),
      recordedSalePrice: product.getSalePrice(),
    });

    try {
      await this.orderRepository.save(cart);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const existingCart = await this.orderRepository.findCartByUserId(userId);
        if (existingCart) {
          existingCart.addItem({
            productId: product.getId()!,
            quantity,
            sellerId: product.getSellerId(),
            recordedSalePrice: product.getSalePrice(),
          });
          await this.orderRepository.save(existingCart);
          return existingCart;
        }
      }
      throw err;
    }

    return cart;
  }

  private validateAddToCartDto(dto: AddToCartDto): { productId: string; quantity: number } {
    const errors = [];

    if (typeof dto.productId !== 'string' || dto.productId.trim().length === 0) {
      errors.push(OrderErrorMessages.PRODUCT_REQUIRED());
    }

    let quantity = 1;
    if (dto.quantity !== undefined) {
      if (typeof dto.quantity !== 'number' || !Number.isInteger(dto.quantity) || dto.quantity <= 0) {
        errors.push(OrderErrorMessages.QUANTITY_INVALID());
      } else {
        quantity = dto.quantity;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return {
      productId: (dto.productId as string).trim(),
      quantity,
    };
  }
}
