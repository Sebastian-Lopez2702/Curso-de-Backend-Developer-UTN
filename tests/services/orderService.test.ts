import { NotAllowedError, ResourceNotFoundError, ValidationError } from '../../src/errors/DomainErrors';
import { IOrderRepository } from '../../src/interfaces/orderRepository';
import { IProductRepository } from '../../src/interfaces/productRepository';
import { IProvinceRepository } from '../../src/interfaces/provinceRepository';
import { Order, OrderStatus } from '../../src/models/order';
import { Product } from '../../src/models/product';
import { Province } from '../../src/models/province';
import { OrderService } from '../../src/services/orderService';

describe('OrderService', () => {
  let orderRepositoryMock: jest.Mocked<IOrderRepository>;
  let productRepositoryMock: jest.Mocked<IProductRepository>;
  let provinceRepositoryMock: jest.Mocked<IProvinceRepository>;
  let orderService: OrderService;

  const USER_ID = 'user-123';
  const PRODUCT_ID = 'product-123';
  const SELLER_ID = 'seller-123';
  const PROVINCE_ID = 'province-123';

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
      incrementStock: jest.fn(),
      existsByCategoryId: jest.fn(),
    };

    provinceRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    orderService = new OrderService(orderRepositoryMock, productRepositoryMock, provinceRepositoryMock);
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

  describe('updateCartItemQuantity', () => {
    it('Debería rechazar si quantity falta o no es un entero mayor a 0', async () => {
      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, {})).rejects.toThrow(ValidationError);
      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 0 })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: -5 })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 2.5 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería lanzar ValidationError si el usuario no tiene carrito', async () => {
      orderRepositoryMock.findCartByUserId.mockResolvedValue(null);

      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 3 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería lanzar ResourceNotFoundError si el producto no existe', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      cart.addItem({ productId: PRODUCT_ID, quantity: 1 });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);
      productRepositoryMock.findById.mockResolvedValue(null);

      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 3 })).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('Debería lanzar ValidationError si el producto está inactivo', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      cart.addItem({ productId: PRODUCT_ID, quantity: 1 });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);

      const inactiveProduct = buildActiveProduct({ isActive: false });
      productRepositoryMock.findById.mockResolvedValue(inactiveProduct);

      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 3 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería lanzar ValidationError si el producto no está en el carrito', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);

      const product = buildActiveProduct();
      productRepositoryMock.findById.mockResolvedValue(product);

      await expect(orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 3 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería actualizar la cantidad del ítem y persistir el carrito', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      cart.addItem({ productId: PRODUCT_ID, quantity: 1 });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);

      const product = buildActiveProduct();
      productRepositoryMock.findById.mockResolvedValue(product);

      const updated = await orderService.updateCartItemQuantity(USER_ID, PRODUCT_ID, { quantity: 4 });

      expect(updated.getItems()[0].getQuantity()).toBe(4);
      expect(orderRepositoryMock.save).toHaveBeenCalledWith(cart);
    });
  });

  describe('removeCartItem', () => {
    it('Debería lanzar ValidationError si el usuario no tiene carrito', async () => {
      orderRepositoryMock.findCartByUserId.mockResolvedValue(null);

      await expect(orderService.removeCartItem(USER_ID, PRODUCT_ID)).rejects.toThrow(ValidationError);
    });

    it('Debería lanzar ValidationError si el ítem no está en el carrito', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);

      await expect(orderService.removeCartItem(USER_ID, PRODUCT_ID)).rejects.toThrow(ValidationError);
    });

    it('Debería eliminar el ítem del carrito y persistir los cambios', async () => {
      const cart = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      cart.addItem({ productId: PRODUCT_ID, quantity: 2 });
      orderRepositoryMock.findCartByUserId.mockResolvedValue(cart);

      const updated = await orderService.removeCartItem(USER_ID, PRODUCT_ID);

      expect(updated.getItems()).toHaveLength(0);
      expect(orderRepositoryMock.save).toHaveBeenCalledWith(cart);
    });
  });

  describe('checkout', () => {
    const validDto = {
      provinceId: PROVINCE_ID,
      address: 'Av. Siempre Viva 742',
    };

    it('Debería rechazar si faltan provinceId o address', async () => {
      await expect(orderService.checkout(USER_ID, 'order-1', { address: 'Calle 1' })).rejects.toThrow(ValidationError);
      await expect(orderService.checkout(USER_ID, 'order-1', { provinceId: PROVINCE_ID })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.checkout(USER_ID, 'order-1', { provinceId: '  ', address: 'Calle 1' })).rejects.toThrow(
        ValidationError,
      );
      await expect(orderService.checkout(USER_ID, 'order-1', { provinceId: PROVINCE_ID, address: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('Debería lanzar ResourceNotFoundError si la orden no existe', async () => {
      orderRepositoryMock.findById.mockResolvedValue(null);

      await expect(orderService.checkout(USER_ID, 'inexistente', validDto)).rejects.toThrow(ResourceNotFoundError);
    });

    it('Debería lanzar NotAllowedError si la orden no pertenece al usuario', async () => {
      const order = new Order({ userId: 'otro-usuario', orderStatus: OrderStatus.CART });
      orderRepositoryMock.findById.mockResolvedValue(order);

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow(NotAllowedError);
    });

    it('Debería lanzar ValidationError si la orden no está en estado CART', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.PENDING_DISPATCH });
      orderRepositoryMock.findById.mockResolvedValue(order);

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow(ValidationError);
    });

    it('Debería lanzar ValidationError si el carrito está vacío', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART, items: [] });
      orderRepositoryMock.findById.mockResolvedValue(order);

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow(ValidationError);
    });

    it('Debería lanzar ResourceNotFoundError si la provincia no existe', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      order.addItem({ productId: PRODUCT_ID, quantity: 1 });
      orderRepositoryMock.findById.mockResolvedValue(order);
      provinceRepositoryMock.findById.mockResolvedValue(null);

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow(ResourceNotFoundError);
    });

    it('Debería descontar stock atómicamente, congelar precios, generar factura con 21% IVA y cambiar estado a PENDING_DISPATCH', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      order.addItem({ productId: 'prod-1', quantity: 2, recordedSalePrice: 1000 });
      order.addItem({ productId: 'prod-2', quantity: 1, recordedSalePrice: 500 });
      orderRepositoryMock.findById.mockResolvedValue(order);

      const province = new Province('Buenos Aires', 500);
      province.assignId(PROVINCE_ID);
      provinceRepositoryMock.findById.mockResolvedValue(province);

      // Simula que prod-1 subió a 1200 y prod-2 subió a 600
      const updatedProd1 = buildActiveProduct({ salePrice: 1200 });
      updatedProd1.assignId('prod-1');
      const updatedProd2 = buildActiveProduct({ salePrice: 600 });
      updatedProd2.assignId('prod-2');

      productRepositoryMock.decrementStock.mockImplementation(async (id: string) => {
        if (id === 'prod-1') return updatedProd1;
        if (id === 'prod-2') return updatedProd2;
        return null;
      });

      const processedOrder = await orderService.checkout(USER_ID, 'order-1', validDto);

      expect(processedOrder.getOrderStatus()).toBe(OrderStatus.PENDING_DISPATCH);
      expect(productRepositoryMock.decrementStock).toHaveBeenCalledWith('prod-1', 2);
      expect(productRepositoryMock.decrementStock).toHaveBeenCalledWith('prod-2', 1);

      // Precios congelados con los actualizados
      expect(processedOrder.getItems()[0].getRecordedSalePrice()).toBe(1200);
      expect(processedOrder.getItems()[1].getRecordedSalePrice()).toBe(600);

      // Factura calculada: subtotal = 2 * 1200 + 1 * 600 = 3000
      // IVA (21%) = 630
      // Envío = 500
      // Total = 4130
      const invoice = processedOrder.getInvoice();
      expect(invoice).toBeDefined();
      expect(invoice?.getSubtotal()).toBe(3000);
      expect(invoice?.getTax()).toBe(630);
      expect(invoice?.getShippingCost()).toBe(500);
      expect(invoice?.getTotal()).toBe(4130);

      const shipping = processedOrder.getShipping();
      expect(shipping?.getAddress()).toBe('Av. Siempre Viva 742');
      expect(shipping?.getProvinceName()).toBe('Buenos Aires');
      expect(shipping?.getCost()).toBe(500);

      expect(orderRepositoryMock.save).toHaveBeenCalledWith(processedOrder);
    });

    it('Debería realizar compensación (rollback de stock) si un producto posterior no tiene stock suficiente', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      order.addItem({ productId: 'prod-1', quantity: 2 });
      order.addItem({ productId: 'prod-2', quantity: 3 });
      orderRepositoryMock.findById.mockResolvedValue(order);

      const province = new Province('Córdoba', 700);
      province.assignId(PROVINCE_ID);
      provinceRepositoryMock.findById.mockResolvedValue(province);

      const updatedProd1 = buildActiveProduct({ salePrice: 1000 });
      updatedProd1.assignId('prod-1');

      // prod-1 descuenta ok, prod-2 falla por falta de stock
      productRepositoryMock.decrementStock.mockImplementation(async (id: string) => {
        if (id === 'prod-1') return updatedProd1;
        return null; // prod-2 falla
      });

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow(ValidationError);

      // Debe haber intentado descontar ambos
      expect(productRepositoryMock.decrementStock).toHaveBeenCalledWith('prod-1', 2);
      expect(productRepositoryMock.decrementStock).toHaveBeenCalledWith('prod-2', 3);

      // Compensación: devolver el stock descontado de prod-1
      expect(productRepositoryMock.incrementStock).toHaveBeenCalledTimes(1);
      expect(productRepositoryMock.incrementStock).toHaveBeenCalledWith('prod-1', 2);

      // No debe haberse guardado la orden
      expect(orderRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('Debería realizar compensación (rollback de stock) si orderRepository.save falla', async () => {
      const order = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });
      order.addItem({ productId: 'prod-1', quantity: 2 });
      orderRepositoryMock.findById.mockResolvedValue(order);

      const province = new Province('Córdoba', 700);
      province.assignId(PROVINCE_ID);
      provinceRepositoryMock.findById.mockResolvedValue(province);

      const updatedProd1 = buildActiveProduct({ salePrice: 1000 });
      updatedProd1.assignId('prod-1');
      productRepositoryMock.decrementStock.mockResolvedValue(updatedProd1);

      orderRepositoryMock.save.mockRejectedValue(new Error('DB Error'));

      await expect(orderService.checkout(USER_ID, 'order-1', validDto)).rejects.toThrow('DB Error');

      expect(productRepositoryMock.incrementStock).toHaveBeenCalledWith('prod-1', 2);
    });
  });

  describe('getMyOrders', () => {
    it('Debería retornar solo órdenes confirmadas del usuario, excluyendo las de estado CART', async () => {
      const confirmedOrder = new Order({ userId: USER_ID, orderStatus: OrderStatus.PENDING_DISPATCH });
      const cartOrder = new Order({ userId: USER_ID, orderStatus: OrderStatus.CART });

      orderRepositoryMock.findByUserId.mockResolvedValue([confirmedOrder, cartOrder]);

      const result = await orderService.getMyOrders(USER_ID);

      expect(orderRepositoryMock.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].getOrderStatus()).toBe(OrderStatus.PENDING_DISPATCH);
    });
  });

  describe('getAllOrders', () => {
    it('Debería retornar todas las órdenes confirmadas del sistema, excluyendo carritos', async () => {
      const order1 = new Order({ userId: 'user-1', orderStatus: OrderStatus.PENDING_DISPATCH });
      const order2 = new Order({ userId: 'user-2', orderStatus: OrderStatus.DELIVERED });
      const cartOrder = new Order({ userId: 'user-3', orderStatus: OrderStatus.CART });

      orderRepositoryMock.findAll.mockResolvedValue([order1, order2, cartOrder]);

      const result = await orderService.getAllOrders();

      expect(orderRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result.map((o) => o.getOrderStatus())).toEqual([OrderStatus.PENDING_DISPATCH, OrderStatus.DELIVERED]);
    });
  });

  describe('getSellerSales', () => {
    it('Debería retornar las ventas del vendedor con datos de producto, subtotal neto y sin exponer carritos ni productos de otros vendedores', async () => {
      const orderConfirmed = new Order({
        userId: 'buyer-1',
        orderStatus: OrderStatus.PENDING_DISPATCH,
        createdAt: new Date('2026-11-01T10:00:00Z'),
      });
      orderConfirmed.assignId('order-1');
      orderConfirmed.addItem({
        productId: 'prod-1',
        quantity: 2,
        recordedSalePrice: 1500,
        sellerId: SELLER_ID,
      });
      orderConfirmed.addItem({
        productId: 'prod-other',
        quantity: 1,
        recordedSalePrice: 3000,
        sellerId: 'other-seller',
      });

      const cartOrder = new Order({
        userId: 'buyer-2',
        orderStatus: OrderStatus.CART,
        createdAt: new Date('2026-11-02T10:00:00Z'),
      });
      cartOrder.addItem({
        productId: 'prod-1',
        quantity: 5,
        recordedSalePrice: 1500,
        sellerId: SELLER_ID,
      });

      orderRepositoryMock.findBySellerId.mockResolvedValue([cartOrder, orderConfirmed]);

      const product = buildActiveProduct({
        sku: 'SKU-001',
        name: 'Camiseta',
        salePrice: 1500,
      });
      product.assignId('prod-1');
      productRepositoryMock.findById.mockResolvedValue(product);

      const sales = await orderService.getSellerSales(SELLER_ID);

      expect(orderRepositoryMock.findBySellerId).toHaveBeenCalledWith(SELLER_ID);
      // Solo una orden confirmada (excluye CART)
      expect(sales).toHaveLength(1);

      const sale = sales[0];
      expect(sale.orderId).toBe('order-1');
      expect(sale.orderStatus).toBe(OrderStatus.PENDING_DISPATCH);
      expect(sale.subtotal).toBe(3000); // 2 * 1500
      expect(sale.items).toHaveLength(1); // Solo el producto de SELLER_ID
      expect(sale.items[0]).toEqual({
        productId: 'prod-1',
        sku: 'SKU-001',
        name: 'Camiseta',
        category: {
          id: undefined,
          name: '',
        },
        quantity: 2,
        recordedSalePrice: 1500,
      });
    });
  });
});
