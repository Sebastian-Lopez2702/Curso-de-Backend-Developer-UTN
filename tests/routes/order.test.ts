import request from 'supertest';
import { app } from '../../src/app';
import { OrderStatus } from '../../src/models/order';
import { UserRole } from '../../src/models/user';
import { OrderModel } from '../../src/repositories/schemas/orderSchema';
import { ProductModel } from '../../src/repositories/schemas/productSchema';
import {
  clearCategories,
  clearOrders,
  clearProducts,
  clearUsers,
  connectTestDb,
  disconnectTestDb,
} from '../helpers/db';
import { createProduct, createUser, tokenFor } from '../helpers/factories';

describe('Order - Carrito', () => {
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

  const createClient = async () => {
    const client = await createUser({ role: UserRole.CLIENT });
    return {
      user: client,
      id: client.getId() as string,
      authorization: `Bearer ${tokenFor(client)}`,
    };
  };

  const createSeller = async () => {
    const seller = await createUser({ role: UserRole.SELLER });
    return {
      user: seller,
      id: seller.getId() as string,
      authorization: `Bearer ${tokenFor(seller)}`,
    };
  };

  const createAdmin = async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    return {
      user: admin,
      id: admin.getId() as string,
      authorization: `Bearer ${tokenFor(admin)}`,
    };
  };

  describe('GET /api/orders/cart', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).get('/api/orders/cart');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 si el rol no es CLIENT', async () => {
      const seller = await createSeller();
      const admin = await createAdmin();

      const resSeller = await request(app).get('/api/orders/cart').set('Authorization', seller.authorization);
      expect(resSeller.status).toBe(403);

      const resAdmin = await request(app).get('/api/orders/cart').set('Authorization', admin.authorization);
      expect(resAdmin.status).toBe(403);
    });

    it('Debería devolver un carrito vacío con 200 si el cliente aún no agregó productos', async () => {
      const client = await createClient();

      const res = await request(app).get('/api/orders/cart').set('Authorization', client.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe(OrderStatus.CART);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.id).toBeNull();
    });

    it('Debería devolver el carrito existente con sus items', async () => {
      const client = await createClient();
      const product = await createProduct({ salePrice: 1500 });

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 2 });

      const res = await request(app).get('/api/orders/cart').set('Authorization', client.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toMatchObject({
        productId: product.getId(),
        quantity: 2,
        recordedSalePrice: 1500,
        sellerId: product.getSellerId(),
      });
    });
  });

  describe('POST /api/orders/cart', () => {
    it('Debería responder 401 sin token', async () => {
      const res = await request(app).post('/api/orders/cart').send({ productId: 'abc' });
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un SELLER o ADMIN', async () => {
      const seller = await createSeller();
      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', seller.authorization)
        .send({ productId: 'abc' });
      expect(res.status).toBe(403);
    });

    it('Debería responder 400 si falta el productId', async () => {
      const client = await createClient();
      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ quantity: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('productId');
    });

    it('Debería responder 400 si la cantidad no es un entero mayor a 0', async () => {
      const client = await createClient();
      const product = await createProduct();

      const resZero = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 0 });
      expect(resZero.status).toBe(400);

      const resNegative = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: -3 });
      expect(resNegative.status).toBe(400);

      const resDecimal = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1.5 });
      expect(resDecimal.status).toBe(400);
    });

    it('Debería responder 404 si el producto no existe', async () => {
      const client = await createClient();

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

      expect(res.status).toBe(404);
    });

    it('Debería responder 400 si el producto está inactivo', async () => {
      const client = await createClient();
      const product = await createProduct();
      await ProductModel.findByIdAndUpdate(product.getId(), { isActive: false });

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('productId');
    });

    it('Debería agregar un producto al carrito creando la orden si no existía', async () => {
      const client = await createClient();
      const product = await createProduct({ salePrice: 2000 });

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.userId).toBe(client.id);
      expect(res.body.data.orderStatus).toBe(OrderStatus.CART);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toMatchObject({
        productId: product.getId(),
        quantity: 3,
        recordedSalePrice: 2000,
        sellerId: product.getSellerId(),
      });
    });

    it('Debería usar cantidad 1 si no se envía el campo quantity', async () => {
      const client = await createClient();
      const product = await createProduct();

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId() });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(1);
    });

    it('Debería acumular la cantidad si el mismo producto se agrega nuevamente', async () => {
      const client = await createClient();
      const product = await createProduct();

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 2 });

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(6);
    });

    it('Debería permitir agregar múltiples productos distintos en el mismo carrito', async () => {
      const client = await createClient();
      const product1 = await createProduct({ name: 'Producto 1' });
      const product2 = await createProduct({ name: 'Producto 2' });

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product1.getId(), quantity: 1 });

      const res = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product2.getId(), quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].productId).toBe(product1.getId());
      expect(res.body.data.items[1].productId).toBe(product2.getId());
    });
  });
});
