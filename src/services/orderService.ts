import { AddToCartDto } from '../dtos/addToCartDto';
import { CheckoutOrderDto } from '../dtos/checkoutOrderDto';
import { SellerSaleDto, SellerSaleItemDto } from '../dtos/sellerSaleDto';
import { UpdateCartItemDto } from '../dtos/updateCartItemDto';
import { UpdateShippingDto } from '../dtos/updateShippingDto';
import { NotAllowedError, ResourceNotFoundError, ValidationError } from '../errors/DomainErrors';
import { IOrderRepository } from '../interfaces/orderRepository';
import { IProductRepository } from '../interfaces/productRepository';
import { IProvinceRepository } from '../interfaces/provinceRepository';
import { Invoice } from '../models/invoice';
import { Order, OrderStatus } from '../models/order';
import { OrderErrorMessages } from '../models/error-messages/orderErrorMessages';
import { Shipping } from '../models/shipping';
import { isDuplicateKeyError } from '../utils/duplicateKey';
import { round2 } from '../utils/money';
import { v7 as uuidv7 } from 'uuid';

const IVA_RATE = 0.21;
const DEFAULT_INVOICE_TYPE = 'Factura B';

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly provinceRepository: IProvinceRepository,
  ) {}

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

  public async updateCartItemQuantity(userId: string, productId: string, dto: UpdateCartItemDto): Promise<Order> {
    const quantity = this.validateUpdateQuantity(dto);

    const cart = await this.orderRepository.findCartByUserId(userId);
    if (!cart) {
      throw new ValidationError([OrderErrorMessages.ITEM_NOT_FOUND()]);
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ResourceNotFoundError('Producto no encontrado');
    }

    if (!product.getIsActive()) {
      throw new ValidationError([OrderErrorMessages.PRODUCT_INACTIVE()]);
    }

    cart.updateItemQuantity(productId, quantity);
    await this.orderRepository.save(cart);

    return cart;
  }

  public async removeCartItem(userId: string, productId: string): Promise<Order> {
    const cart = await this.orderRepository.findCartByUserId(userId);
    if (!cart) {
      throw new ValidationError([OrderErrorMessages.ITEM_NOT_FOUND()]);
    }

    cart.removeItem(productId);
    await this.orderRepository.save(cart);

    return cart;
  }

  public async checkout(userId: string, orderId: string, dto: CheckoutOrderDto): Promise<Order> {
    const { provinceId, address } = this.validateCheckoutDto(dto);

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new ResourceNotFoundError('Orden no encontrada');
    }

    if (order.getUserId() !== userId) {
      throw new NotAllowedError('No tenés permisos para realizar el checkout de esta orden');
    }

    if (order.getOrderStatus() !== OrderStatus.CART) {
      throw new ValidationError([OrderErrorMessages.ORDER_NOT_IN_CART_STATUS()]);
    }

    const items = order.getItems();
    if (items.length === 0) {
      throw new ValidationError([OrderErrorMessages.CART_EMPTY()]);
    }

    const province = await this.provinceRepository.findById(provinceId);
    if (!province) {
      throw new ResourceNotFoundError('Provincia no encontrada');
    }

    const decrementedItems: { productId: string; quantity: number }[] = [];

    try {
      for (const item of items) {
        const updatedProduct = await this.productRepository.decrementStock(item.getProductId(), item.getQuantity());

        if (!updatedProduct) {
          throw new ValidationError([OrderErrorMessages.INSUFFICIENT_STOCK(item.getProductId())]);
        }

        decrementedItems.push({ productId: item.getProductId(), quantity: item.getQuantity() });
        item.setRecordedSalePrice(updatedProduct.getSalePrice());
      }

      const shippingCost = round2(province.getShippingCost());
      const shipping = new Shipping({
        address,
        provinceId: province.getId(),
        provinceName: province.getName(),
        cost: shippingCost,
      });

      const subtotal = round2(
        items.reduce((sum, item) => sum + item.getQuantity() * (item.getRecordedSalePrice() ?? 0), 0),
      );
      const tax = round2(subtotal * IVA_RATE);
      const total = round2(subtotal + tax + shippingCost);

      const invoice = new Invoice({
        invoiceType: DEFAULT_INVOICE_TYPE,
        subtotal,
        tax,
        shippingCost,
        total,
        date: new Date(),
      });

      order.setShipping(shipping);
      order.setInvoice(invoice);
      order.changeStatus(OrderStatus.PENDING_DISPATCH);

      await this.orderRepository.save(order);
      return order;
    } catch (err) {
      for (const decremented of decrementedItems) {
        await this.productRepository.incrementStock(decremented.productId, decremented.quantity);
      }
      throw err;
    }
  }

  public async getMyOrders(userId: string): Promise<Order[]> {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.filter((order) => order.getOrderStatus() !== OrderStatus.CART);
  }

  public async getAllOrders(): Promise<Order[]> {
    const orders = await this.orderRepository.findAll();
    return orders.filter((order) => order.getOrderStatus() !== OrderStatus.CART);
  }

  public async getSellerSales(sellerId: string): Promise<SellerSaleDto[]> {
    const orders = await this.orderRepository.findBySellerId(sellerId);
    const confirmedOrders = orders.filter((order) => order.getOrderStatus() !== OrderStatus.CART);

    const sales: SellerSaleDto[] = [];

    for (const order of confirmedOrders) {
      const sellerItems = order.getItems().filter((item) => item.getSellerId() === sellerId);
      if (sellerItems.length === 0) continue;

      const itemsDto: SellerSaleItemDto[] = [];
      let subtotal = 0;

      for (const item of sellerItems) {
        const product = await this.productRepository.findById(item.getProductId());
        const recordedPrice = item.getRecordedSalePrice() ?? 0;
        const itemSubtotal = round2(item.getQuantity() * recordedPrice);
        subtotal = round2(subtotal + itemSubtotal);

        itemsDto.push({
          productId: item.getProductId(),
          sku: product ? product.getSku() : '',
          name: product ? product.getName() : '',
          category: {
            id: product?.getCategory()?.getId(),
            name: product?.getCategory()?.getName() ?? '',
          },
          quantity: item.getQuantity(),
          recordedSalePrice: recordedPrice,
        });
      }

      const saleDate = order.getInvoice()?.getDate() ?? order.getUpdatedAt() ?? order.getCreatedAt();

      sales.push({
        orderId: order.getId(),
        orderStatus: order.getOrderStatus(),
        saleDate,
        items: itemsDto,
        subtotal,
      });
    }

    return this.sortBySaleDateDescending(sales);
  }

  public async updateShippingStatus(orderId: string, dto: UpdateShippingDto): Promise<Order> {
    const { orderStatus } = this.validateUpdateShippingDto(dto);

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new ResourceNotFoundError('Orden no encontrada');
    }

    if (order.getOrderStatus() === OrderStatus.CART) {
      throw new ValidationError([OrderErrorMessages.CANNOT_UPDATE_CART_SHIPPING()]);
    }

    order.changeStatus(orderStatus);

    if (orderStatus === OrderStatus.IN_TRANSIT) {
      const trackingCode = this.generateTrackingCode();
      order.getShipping()?.setTrackingCode(trackingCode);
    }

    if (orderStatus === OrderStatus.CANCELLED) {
      for (const item of order.getItems()) {
        await this.productRepository.incrementStock(item.getProductId(), item.getQuantity());
      }
    }

    await this.orderRepository.save(order);
    return order;
  }

  private generateTrackingCode(): string {
    return uuidv7();
  }

  private validateUpdateShippingDto(dto: UpdateShippingDto): { orderStatus: OrderStatus } {
    const errors = [];

    if (!dto.orderStatus) {
      errors.push(OrderErrorMessages.STATUS_REQUIRED());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return {
      orderStatus: dto.orderStatus as OrderStatus,
    };
  }

  private sortBySaleDateDescending(sales: SellerSaleDto[]): SellerSaleDto[] {
    return sales.sort((firstSale, secondSale) => {
      const firstTimestamp = firstSale.saleDate?.getTime() ?? 0;
      const secondTimestamp = secondSale.saleDate?.getTime() ?? 0;
      return secondTimestamp - firstTimestamp;
    });
  }

  private validateCheckoutDto(dto: CheckoutOrderDto): { provinceId: string; address: string } {
    const errors = [];

    if (typeof dto.provinceId !== 'string' || dto.provinceId.trim().length === 0) {
      errors.push(OrderErrorMessages.PROVINCE_REQUIRED());
    }

    if (typeof dto.address !== 'string' || dto.address.trim().length === 0) {
      errors.push(OrderErrorMessages.ADDRESS_REQUIRED());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return {
      provinceId: (dto.provinceId as string).trim(),
      address: (dto.address as string).trim(),
    };
  }

  private validateUpdateQuantity(dto: UpdateCartItemDto): number {
    const errors = [];

    if (
      dto.quantity === undefined ||
      typeof dto.quantity !== 'number' ||
      !Number.isInteger(dto.quantity) ||
      dto.quantity <= 0
    ) {
      errors.push(OrderErrorMessages.QUANTITY_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return dto.quantity as number;
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
