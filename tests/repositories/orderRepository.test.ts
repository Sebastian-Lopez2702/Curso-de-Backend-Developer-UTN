import mongoose from 'mongoose';
import { Invoice } from '../../src/models/invoice';
import { Order, OrderStatus } from '../../src/models/order';
import { Shipping } from '../../src/models/shipping';
import { OrderRepository } from '../../src/repositories/orderRepository';
import { OrderModel } from '../../src/repositories/schemas/orderSchema';
import {
  clearCategories,
  clearOrders,
  clearProducts,
  clearUsers,
  connectTestDb,
  disconnectTestDb,
} from '../helpers/db';
import { createProduct, createUser } from '../helpers/factories';

describe('OrderRepository', () => {
  const repository = new OrderRepository();

  const clearAll = async () => {
    await clearOrders();
    await clearProducts();
    await clearCategories();
    await clearUsers();
  };

  beforeAll(async () => {
    await connectTestDb();
    try {
      await OrderModel.collection.drop();
    } catch {
      // Ignora si la colección no existe aún
    }
    await OrderModel.init();
  });

  beforeEach(clearAll);

  afterAll(async () => {
    await clearAll();
    await disconnectTestDb();
  });

  describe('save', () => {
    it('Debería guardar una orden nueva y asignarle el id a la entidad', async () => {
      const user = await createUser();
      const product = await createProduct();

      const order = new Order({
        userId: user.getId() as string,
        orderStatus: OrderStatus.CART,
      });
      order.addItem({
        productId: product.getId() as string,
        quantity: 2,
        sellerId: product.getSellerId(),
        recordedSalePrice: product.getSalePrice(),
      });

      await repository.save(order);

      expect(order.getId()).toBeDefined();
      const record = await OrderModel.findById(order.getId());
      expect(record).not.toBeNull();
      expect(record?.userId.toString()).toBe(user.getId());
      expect(record?.orderStatus).toBe(OrderStatus.CART);
      expect(record?.items).toHaveLength(1);
      expect(record?.items[0].productId.toString()).toBe(product.getId());
      expect(record?.items[0].quantity).toBe(2);
      expect(record?.items[0].recordedSalePrice).toBe(product.getSalePrice());
      expect(record?.items[0].sellerId?.toString()).toBe(product.getSellerId());
    });

    it('Debería persistir invoice y shipping correctamente', async () => {
      const user = await createUser();
      const order = new Order({
        userId: user.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });

      const invoice = new Invoice({
        invoiceType: 'B',
        subtotal: 1000,
        tax: 210,
        shippingCost: 500,
        total: 1710,
      });
      order.setInvoice(invoice);

      const provinceId = new mongoose.Types.ObjectId().toString();
      const shipping = new Shipping({
        address: 'Calle Falsa 123',
        provinceId,
        provinceName: 'Córdoba',
        cost: 500,
        trackingCode: 'TRACK-1234',
      });
      order.setShipping(shipping);

      await repository.save(order);

      const found = await repository.findById(order.getId() as string);
      expect(found).not.toBeNull();
      expect(found?.getInvoice()?.getTotal()).toBe(1710);
      expect(found?.getInvoice()?.getTax()).toBe(210);
      expect(found?.getShipping()?.getAddress()).toBe('Calle Falsa 123');
      expect(found?.getShipping()?.getProvinceId()).toBe(provinceId);
      expect(found?.getShipping()?.getTrackingCode()).toBe('TRACK-1234');
    });

    it('Debería actualizar una orden existente si ya tiene id', async () => {
      const user = await createUser();
      const product1 = await createProduct();
      const product2 = await createProduct();

      const order = new Order({ userId: user.getId() as string });
      order.addItem({ productId: product1.getId() as string, quantity: 1 });
      await repository.save(order);

      const orderId = order.getId();
      expect(orderId).toBeDefined();

      order.addItem({ productId: product2.getId() as string, quantity: 3 });
      await repository.save(order);

      expect(order.getId()).toBe(orderId);
      const updated = await repository.findById(orderId as string);
      expect(updated?.getItems()).toHaveLength(2);
      expect(updated?.getItems()[1].getQuantity()).toBe(3);
    });

    it('Debería propagar error de clave duplicada si se intenta guardar un segundo carrito activo', async () => {
      const user = await createUser();

      const cart1 = new Order({ userId: user.getId() as string, orderStatus: OrderStatus.CART });
      await repository.save(cart1);

      const cart2 = new Order({ userId: user.getId() as string, orderStatus: OrderStatus.CART });
      await expect(repository.save(cart2)).rejects.toMatchObject({ code: 11000 });
    });
  });

  describe('findById', () => {
    it('Debería encontrar una orden por id y devolver una entidad Order completa', async () => {
      const user = await createUser();
      const product = await createProduct();

      const order = new Order({ userId: user.getId() as string });
      order.addItem({ productId: product.getId() as string, quantity: 4 });
      await repository.save(order);

      const found = await repository.findById(order.getId() as string);
      expect(found).toBeInstanceOf(Order);
      expect(found?.getId()).toBe(order.getId());
      expect(found?.getUserId()).toBe(user.getId());
      expect(found?.getOrderStatus()).toBe(OrderStatus.CART);
      expect(found?.getItems()).toHaveLength(1);
    });

    it('Debería devolver null si el id no es un ObjectId válido', async () => {
      expect(await repository.findById('id-invalido')).toBeNull();
    });

    it('Debería devolver null si el id no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      expect(await repository.findById(nonExistentId)).toBeNull();
    });
  });

  describe('findCartByUserId', () => {
    it('Debería encontrar el carrito activo del usuario', async () => {
      const user = await createUser();
      const cart = new Order({ userId: user.getId() as string, orderStatus: OrderStatus.CART });
      await repository.save(cart);

      const found = await repository.findCartByUserId(user.getId() as string);
      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(cart.getId());
      expect(found?.getOrderStatus()).toBe(OrderStatus.CART);
    });

    it('Debería ignorar órdenes del usuario que no estén en estado CART', async () => {
      const user = await createUser();
      const previousOrder = new Order({
        userId: user.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });
      await repository.save(previousOrder);

      const found = await repository.findCartByUserId(user.getId() as string);
      expect(found).toBeNull();
    });

    it('Debería devolver null si el usuario no tiene carrito', async () => {
      const user = await createUser();
      expect(await repository.findCartByUserId(user.getId() as string)).toBeNull();
    });

    it('Debería devolver null si el userId no es un ObjectId válido', async () => {
      expect(await repository.findCartByUserId('no-un-id')).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('Debería devolver todas las órdenes de un usuario ordenadas descendentemente por fecha', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      const order1 = new Order({
        userId: user1.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });
      const order2 = new Order({
        userId: user1.getId() as string,
        orderStatus: OrderStatus.CART,
      });
      const otherUserOrder = new Order({
        userId: user2.getId() as string,
        orderStatus: OrderStatus.CART,
      });

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(otherUserOrder);

      const orders = await repository.findByUserId(user1.getId() as string);
      expect(orders).toHaveLength(2);
      expect(orders.every((o) => o.getUserId() === user1.getId())).toBe(true);
    });

    it('Debería devolver un array vacío si el userId es inválido o no tiene órdenes', async () => {
      expect(await repository.findByUserId('invalido')).toEqual([]);
      const user = await createUser();
      expect(await repository.findByUserId(user.getId() as string)).toEqual([]);
    });
  });

  describe('findBySellerId', () => {
    it('Debería devolver las órdenes que contienen productos del vendedor', async () => {
      const seller1 = await createUser({ role: 'SELLER' });
      const seller2 = await createUser({ role: 'SELLER' });
      const buyer = await createUser();

      const product1 = await createProduct({ sellerId: seller1.getId() as string });
      const product2 = await createProduct({ sellerId: seller2.getId() as string });

      const orderWithSeller1 = new Order({
        userId: buyer.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });
      orderWithSeller1.addItem({
        productId: product1.getId() as string,
        quantity: 1,
        sellerId: seller1.getId() as string,
      });

      const orderWithBoth = new Order({
        userId: buyer.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });
      orderWithBoth.addItem({
        productId: product1.getId() as string,
        quantity: 2,
        sellerId: seller1.getId() as string,
      });
      orderWithBoth.addItem({
        productId: product2.getId() as string,
        quantity: 1,
        sellerId: seller2.getId() as string,
      });

      const orderWithoutSeller1 = new Order({
        userId: buyer.getId() as string,
        orderStatus: OrderStatus.PENDING_DISPATCH,
      });
      orderWithoutSeller1.addItem({
        productId: product2.getId() as string,
        quantity: 5,
        sellerId: seller2.getId() as string,
      });

      await repository.save(orderWithSeller1);
      await repository.save(orderWithBoth);
      await repository.save(orderWithoutSeller1);

      const seller1Sales = await repository.findBySellerId(seller1.getId() as string);
      expect(seller1Sales).toHaveLength(2);

      const seller2Sales = await repository.findBySellerId(seller2.getId() as string);
      expect(seller2Sales).toHaveLength(2);
    });

    it('Debería devolver un array vacío si el sellerId es inválido o no tiene ventas', async () => {
      expect(await repository.findBySellerId('invalido')).toEqual([]);
      const seller = await createUser({ role: 'SELLER' });
      expect(await repository.findBySellerId(seller.getId() as string)).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('Debería devolver todas las órdenes existentes', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await repository.save(new Order({ userId: user1.getId() as string }));
      await repository.save(new Order({ userId: user2.getId() as string }));

      const allOrders = await repository.findAll();
      expect(allOrders).toHaveLength(2);
      expect(allOrders[0]).toBeInstanceOf(Order);
      expect(allOrders[1]).toBeInstanceOf(Order);
    });
  });
});
