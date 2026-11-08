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
  clearProvinces,
  clearUsers,
  connectTestDb,
  disconnectTestDb,
} from '../helpers/db';
import { createProduct, createProvince, createUser, tokenFor } from '../helpers/factories';

describe('Order - Carrito', () => {
  const clearAll = async () => {
    await clearOrders();
    await clearProducts();
    await clearCategories();
    await clearProvinces();
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
        .send({ productId: 'FictitiousProductId', quantity: 1 });

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

  describe('PUT /api/orders/cart/items/:productId', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).put('/api/orders/cart/items/FictitiousProductId').send({ quantity: 2 });
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios no CLIENT', async () => {
      const seller = await createSeller();
      const res = await request(app)
        .put('/api/orders/cart/items/FictitiousProductId')
        .set('Authorization', seller.authorization)
        .send({ quantity: 2 });
      expect(res.status).toBe(403);
    });

    it('Debería responder 400 si quantity no es un entero mayor a 0', async () => {
      const client = await createClient();
      const product = await createProduct();

      const resEmpty = await request(app)
        .put(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization)
        .send({});
      expect(resEmpty.status).toBe(400);

      const resZero = await request(app)
        .put(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization)
        .send({ quantity: 0 });
      expect(resZero.status).toBe(400);

      const resDecimal = await request(app)
        .put(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization)
        .send({ quantity: 2.5 });
      expect(resDecimal.status).toBe(400);
    });

    it('Debería responder 404 si el producto no existe', async () => {
      const client = await createClient();
      const product = await createProduct();

      // Creamos carrito primero
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });

      const res = await request(app)
        .put('/api/orders/cart/items/FictitiousProductId')
        .set('Authorization', client.authorization)
        .send({ quantity: 3 });

      expect(res.status).toBe(404);
    });

    it('Debería responder 400 si el producto está inactivo', async () => {
      const client = await createClient();
      const product = await createProduct();

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });

      await ProductModel.findByIdAndUpdate(product.getId(), { isActive: false });

      const res = await request(app)
        .put(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization)
        .send({ quantity: 3 });

      expect(res.status).toBe(400);
    });

    it('Debería responder 400 si el ítem no está en el carrito', async () => {
      const client = await createClient();
      const product1 = await createProduct();
      const product2 = await createProduct();

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product1.getId(), quantity: 1 });

      const res = await request(app)
        .put(`/api/orders/cart/items/${product2.getId()}`)
        .set('Authorization', client.authorization)
        .send({ quantity: 3 });

      expect(res.status).toBe(400);
    });

    it('Debería actualizar la cantidad del ítem correctamente', async () => {
      const client = await createClient();
      const product = await createProduct();

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 2 });

      const res = await request(app)
        .put(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].quantity).toBe(5);
    });
  });

  describe('DELETE /api/orders/cart/items/:productId', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).delete('/api/orders/cart/items/FictitiousProductId');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios no CLIENT', async () => {
      const seller = await createSeller();
      const res = await request(app)
        .delete('/api/orders/cart/items/FictitiousProductId')
        .set('Authorization', seller.authorization);
      expect(res.status).toBe(403);
    });

    it('Debería responder 400 si el usuario no tiene carrito o el ítem no existe en el carrito', async () => {
      const client = await createClient();
      const product = await createProduct();

      const resNoCart = await request(app)
        .delete(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization);
      expect(resNoCart.status).toBe(400);

      // Creamos carrito con otro producto
      const otherProduct = await createProduct();
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: otherProduct.getId(), quantity: 1 });

      const resNotPresent = await request(app)
        .delete(`/api/orders/cart/items/${product.getId()}`)
        .set('Authorization', client.authorization);
      expect(resNotPresent.status).toBe(400);
    });

    it('Debería eliminar el ítem del carrito exitosamente', async () => {
      const client = await createClient();
      const product1 = await createProduct();
      const product2 = await createProduct();

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product1.getId(), quantity: 2 });
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product2.getId(), quantity: 1 });

      const res = await request(app)
        .delete(`/api/orders/cart/items/${product1.getId()}`)
        .set('Authorization', client.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productId).toBe(product2.getId());
    });
  });

  describe('POST /api/orders/:id/checkout', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).post('/api/orders/FictitiousOrderId/checkout').send({
        provinceId: 'FictitiousProvinceId',
        address: 'Calle 123',
      });
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios con rol distinto a CLIENT', async () => {
      const seller = await createSeller();
      const res = await request(app)
        .post('/api/orders/FictitiousOrderId/checkout')
        .set('Authorization', seller.authorization)
        .send({
          provinceId: 'FictitiousProvinceId',
          address: 'Calle 123',
        });
      expect(res.status).toBe(403);
    });

    it('Debería responder 400 si faltan provinceId o address', async () => {
      const client = await createClient();

      const resMissingProvince = await request(app)
        .post('/api/orders/FictitiousOrderId/checkout')
        .set('Authorization', client.authorization)
        .send({ address: 'Calle 123' });
      expect(resMissingProvince.status).toBe(400);

      const resMissingAddress = await request(app)
        .post('/api/orders/FictitiousOrderId/checkout')
        .set('Authorization', client.authorization)
        .send({ provinceId: 'FictitiousProvinceId' });
      expect(resMissingAddress.status).toBe(400);
    });

    it('Debería responder 404 si la orden no existe', async () => {
      const client = await createClient();
      const province = await createProvince('Córdoba', 500);

      const res = await request(app)
        .post('/api/orders/FictitiousOrderId/checkout')
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Calle 123' });

      expect(res.status).toBe(404);
    });

    it('Debería responder 403 si la orden pertenece a otro cliente', async () => {
      const client1 = await createClient();
      const client2 = await createClient();
      const product = await createProduct({ stock: 5 });
      const province = await createProvince('Córdoba', 500);

      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client1.authorization)
        .send({ productId: product.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      const res = await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client2.authorization)
        .send({ provinceId: province.getId(), address: 'Calle 123' });

      expect(res.status).toBe(403);
    });

    it('Debería responder 404 si la provincia indicada no existe', async () => {
      const client = await createClient();
      const product = await createProduct({ stock: 5 });

      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      const res = await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: 'FictitiousProvinceId', address: 'Calle 123' });

      expect(res.status).toBe(404);
    });

    it('Debería responder 400 y realizar rollback del inventario si no hay stock suficiente para uno de los productos', async () => {
      const client = await createClient();
      const product1 = await createProduct({ stock: 5, salePrice: 1000 });
      const product2 = await createProduct({ stock: 1, salePrice: 2000 });
      const province = await createProvince('Santa Fe', 400);

      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product1.getId(), quantity: 2 });
      const orderId = cartRes.body.data.id;

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product2.getId(), quantity: 3 }); // pide 3 pero hay solo 1

      const res = await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Av. Libertador 100' });

      expect(res.status).toBe(400);

      // Verificamos que el stock del product1 haya sido devuelto intacto (compensación)
      const freshProd1 = await ProductModel.findById(product1.getId());
      expect(freshProd1?.stock).toBe(5);

      const freshProd2 = await ProductModel.findById(product2.getId());
      expect(freshProd2?.stock).toBe(1);

      // La orden sigue en estado CART
      const freshOrder = await OrderModel.findById(orderId);
      expect(freshOrder?.orderStatus).toBe(OrderStatus.CART);
    });

    it('Debería completar el checkout exitosamente con cálculo de IVA y congelamiento de precio', async () => {
      const client = await createClient();
      const product1 = await createProduct({ stock: 10, salePrice: 1000 });
      const product2 = await createProduct({ stock: 5, salePrice: 2500 });
      const province = await createProvince('Buenos Aires', 600);

      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product1.getId(), quantity: 2 });
      const orderId = cartRes.body.data.id;

      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product2.getId(), quantity: 1 });

      // Cambiamos el precio de product1 en el catálogo a 1200 antes de pagar
      await ProductModel.findByIdAndUpdate(product1.getId(), { salePrice: 1200 });

      const res = await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'San Martín 450' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe(OrderStatus.PENDING_DISPATCH);

      // Stock descontado en la DB
      const freshProd1 = await ProductModel.findById(product1.getId());
      expect(freshProd1?.stock).toBe(8);

      const freshProd2 = await ProductModel.findById(product2.getId());
      expect(freshProd2?.stock).toBe(4);

      // Precios sincronizados y congelados
      const items = res.body.data.items;
      expect(items[0].recordedSalePrice).toBe(1200);
      expect(items[1].recordedSalePrice).toBe(2500);

      // Factura (subtotal = 2 * 1200 + 1 * 2500 = 4900)
      // tax (21%) = 1029
      // shipping = 600
      // total = 6529
      const invoice = res.body.data.invoice;
      expect(invoice.subtotal).toBe(4900);
      expect(invoice.tax).toBe(1029);
      expect(invoice.shippingCost).toBe(600);
      expect(invoice.total).toBe(6529);

      const shipping = res.body.data.shipping;
      expect(shipping.cost).toBe(600);
      expect(shipping.address).toBe('San Martín 450');
      expect(shipping.provinceName).toBe('Buenos Aires');
    });

    it('Debería responder 400 si se intenta hacer checkout de una orden que ya fue pagada', async () => {
      const client = await createClient();
      const product = await createProduct({ stock: 5, salePrice: 1000 });
      const province = await createProvince('Mendoza', 500);

      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      // Primer checkout
      await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Calle 1' });

      // Segundo intento de checkout
      const resSecond = await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Calle 1' });

      expect(resSecond.status).toBe(400);
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).get('/api/orders/my-orders');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios no CLIENT', async () => {
      const seller = await createSeller();
      const res = await request(app).get('/api/orders/my-orders').set('Authorization', seller.authorization);
      expect(res.status).toBe(403);
    });

    it('Debería listar solo órdenes confirmadas del cliente, excluyendo el carrito', async () => {
      const client = await createClient();
      const product = await createProduct({ stock: 5, salePrice: 1000 });
      const province = await createProvince('Buenos Aires', 500);

      // Crear carrito y pagar para tener una orden confirmada
      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Av. Corrientes 1234' });

      // Ahora agregar otro producto al nuevo carrito (estado CART)
      const product2 = await createProduct({ stock: 5 });
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product2.getId(), quantity: 1 });

      const res = await request(app).get('/api/orders/my-orders').set('Authorization', client.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(orderId);
      expect(res.body.data[0].orderStatus).toBe(OrderStatus.PENDING_DISPATCH);
    });
  });

  describe('GET /api/orders/seller-sales', () => {
    it('Debería responder 401 si no se envía token', async () => {
      const res = await request(app).get('/api/orders/seller-sales');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios no SELLER', async () => {
      const client = await createClient();
      const res = await request(app).get('/api/orders/seller-sales').set('Authorization', client.authorization);
      expect(res.status).toBe(403);
    });

    it('Debería retornar ventas con datos del producto, subtotal neto, sin datos de otros vendedores ni órdenes en CART', async () => {
      const seller1 = await createSeller();
      const seller2 = await createSeller();
      const buyer = await createClient();
      const province = await createProvince('Santa Fe', 300);

      const prodSeller1 = await createProduct({
        sellerId: seller1.id,
        stock: 10,
        salePrice: 1200,
        name: 'Libro A',
        sku: 'SKU-LIB-A',
      });
      const prodSeller2 = await createProduct({
        sellerId: seller2.id,
        stock: 10,
        salePrice: 3500,
        name: 'Libro B',
        sku: 'SKU-LIB-B',
      });

      // El comprador agrega ambos y hace checkout
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', buyer.authorization)
        .send({ productId: prodSeller1.getId(), quantity: 2 });
      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', buyer.authorization)
        .send({ productId: prodSeller2.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', buyer.authorization)
        .send({ provinceId: province.getId(), address: 'Urquiza 500' });

      // Otro cliente agrega prodSeller1 al carrito pero NO hace checkout (queda en CART)
      const buyer2 = await createClient();
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', buyer2.authorization)
        .send({ productId: prodSeller1.getId(), quantity: 3 });

      // Consultar ventas de seller1
      const res = await request(app).get('/api/orders/seller-sales').set('Authorization', seller1.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);

      const sale = res.body.data[0];
      expect(sale.orderId).toBe(orderId);
      expect(sale.orderStatus).toBe(OrderStatus.PENDING_DISPATCH);
      expect(sale.subtotal).toBe(2400); // 2 * 1200
      expect(sale.items).toHaveLength(1);
      expect(sale.items[0]).toMatchObject({
        productId: prodSeller1.getId(),
        sku: 'SKU-LIB-A',
        name: 'Libro A',
        quantity: 2,
        recordedSalePrice: 1200,
      });
      expect(sale.items[0].category).toHaveProperty('name');
      // No debe exponer userId ni productos de seller2
      expect(sale).not.toHaveProperty('userId');
      expect(sale).not.toHaveProperty('invoice');
    });
  });

  describe('GET /api/orders', () => {
    it('Debería responder 401 sin token', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para usuarios no ADMIN', async () => {
      const client = await createClient();
      const res = await request(app).get('/api/orders').set('Authorization', client.authorization);
      expect(res.status).toBe(403);
    });

    it('Debería devolver todas las órdenes confirmadas del sistema', async () => {
      const admin = await createAdmin();
      const client = await createClient();
      const product = await createProduct({ stock: 10, salePrice: 1000 });
      const province = await createProvince('Córdoba', 500);

      // Crear orden y pagar
      const cartRes = await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client.authorization)
        .send({ productId: product.getId(), quantity: 1 });
      const orderId = cartRes.body.data.id;

      await request(app)
        .post(`/api/orders/${orderId}/checkout`)
        .set('Authorization', client.authorization)
        .send({ provinceId: province.getId(), address: 'Calle 1' });

      // Dejar un carrito abierto sin pagar
      const client2 = await createClient();
      await request(app)
        .post('/api/orders/cart')
        .set('Authorization', client2.authorization)
        .send({ productId: product.getId(), quantity: 1 });

      const res = await request(app).get('/api/orders').set('Authorization', admin.authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(orderId);
      expect(res.body.data[0].orderStatus).toBe(OrderStatus.PENDING_DISPATCH);
    });
  });
});
