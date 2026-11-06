import { ResourceNotFoundError, ValidationError } from '../../src/errors/DomainErrors';
import { IOrderRepository } from '../../src/interfaces/orderRepository';
import { IProductRepository } from '../../src/interfaces/productRepository';
import { Order, OrderStatus } from '../../src/models/order';
import { Product } from '../../src/models/product';
import { OrderService } from '../../src/services/orderService';

describe('OrderService', () => {
  let orderRepositoryMock: jest.Mocked<IOrderRepository>;
  let productRepositoryMock: jest.Mocked<IProductRepository>;
  let orderService: OrderService;

  const USER_ID = 'user-123';
  const PRODUCT_ID = 'product-123';
  const SELLER_ID = 'seller-123';

  beforeEach(() => {
    orderRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findCartByUserId: jest.fn(),
      findByUserId: jest.fn(),
      findBySellerId: jest.fn(),
      findAll: jest.fn(),
    };

    productRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdAndSellerId: jest.fn(),
      findPaginated: jest.fn(),
      findBySellerId: jest.fn(),
      decrementStock: jest.fn(),
      existsByCategoryId: jest.fn(),
    };

    orderService = new OrderService(orderRepositoryMock, productRepositoryMock);
  });

  const buildActiveProduct = (overrides = {}): Product => {
    const product = new Product({
      sku: 'SKU-TEST',
      name: 'Producto Test',
      description: 'Descripción test',
      salePrice: 1500,
      stock: 10,
      categoryId: 'cat-123',
      sellerId: SELLER_ID,
      isActive: true,
      ...overrides,
    });
    product.assignId(PRODUCT_ID);
    return product;
  };

  describe('getCart', () => {
    it('Debería retornar el carrito existente del usuario', async () => {
      const existingCart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      existingCart.assignId('order-1');
      orderRepositoryMock.findCartByUserId.mockResolvedValue(existingCart);

      const result = await orderService.getCart(USER_ID);

      expect(orderRepositoryMock.findCartByUserId).toHaveBeenCalledWith(USER_ID);
      expect(result).toBe(existingCart);
      expect(result.getId()).toBe('order-1');
    });

    it('Debería retornar una instancia de carrito vacío si el usuario no tiene carrito previo', async () => {
      orderRepositoryMock.findCartByUserId.mockResolvedValue(null);

      const result = await orderService.getCart(USER_ID);

      expect(result.getUserId()).toBe(USER_ID);
      expect(result.getOrderStatus()).toBe(OrderStatus.CART);
      expect(result.getItems()).toHaveLength(0);
      expect(result.getId()).toBeUndefined();
    });
  });

  describe('addToCart', () => {
    it('Debería rechazar si falta productId', async () => {
      await expect(orderService.addToCart(USER_ID, { productId: '' })).rejects.toThrow(ValidationError);
      await expect(orderService.addToCart(USER_ID, { productId: undefined })).rejects.toThrow(ValidationError);
    });

    it('Debería rechazar si la cantidad es inválida (menor a 1 o no entera)', async () => {
      await expect(orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: 0 })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: -2 })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: 1.5 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería lanzar ResourceNotFoundError si el producto no existe', async () => {
      productRepositoryMock.findById.mockResolvedValue(null);

      await expect(orderService.addToCart(USER_ID, { productId: 'inexistente', quantity: 1 })).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('Debería lanzar ValidationError si el producto existe pero está inactivo', async () => {
      const inactiveProduct = buildActiveProduct({ isActive: false });
      productRepositoryMock.findById.mockResolvedValue(inactiveProduct);

      await expect(orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: 1 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería crear un nuevo carrito y agregar el producto si no existía carrito', async () => {
      const product = buildActiveProduct();
      productRepositoryMock.findById.mockResolvedValue(product);
      orderRepositoryMock.findCartByUserId.mockResolvedValue(null);

      const cart = await orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: 2 });

      expect(cart.getUserId()).toBe(USER_ID);
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].getProductId()).toBe(PRODUCT_ID);
      expect(cart.getItems()[0].getQuantity()).toBe(2);
      expect(cart.getItems()[0].getSellerId()).toBe(SELLER_ID);
      expect(cart.getItems()[0].getRecordedSalePrice()).toBe(1500);
      expect(orderRepositoryMock.save).toHaveBeenCalledWith(cart);
    });

    it('Debería usar quantity = 1 por defecto si no se especifica', async () => {
      const product = buildActiveProduct();
      productRepositoryMock.findById.mockResolvedValue(product);
      orderRepositoryMock.findCartByUserId.mockResolvedValue(null);

      const cart = await orderService.addToCart(USER_ID, { productId: PRODUCT_ID });

      expect(cart.getItems()[0].getQuantity()).toBe(1);
    });

    it('Debería agregar a un carrito existente e incrementar cantidad si el producto ya estaba', async () => {
      const product = buildActiveProduct();
      productRepositoryMock.findById.mockResolvedValue(product);

      const existingCart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      existingCart.addItem({ productId: PRODUCT_ID, quantity: 2 });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(existingCart);

      const updatedCart = await orderService.addToCart(USER_ID, { productId: PRODUCT_ID, quantity: 3 });

      expect(updatedCart.getItems()).toHaveLength(1);
      expect(updatedCart.getItems()[0].getQuantity()).toBe(5);
      expect(orderRepositoryMock.save).toHaveBeenCalledWith(existingCart);
    });
  });
});
