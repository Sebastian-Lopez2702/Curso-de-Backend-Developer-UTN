import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';
import { UserRole } from '../../src/models/user';
import { ProductModel } from '../../src/repositories/schemas/productSchema';
import { clearCategories, clearProducts, clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createCategory, createProduct, createUser, tokenFor } from '../helpers/factories';

describe('Producto', () => {
  const clearAll = async () => {
    await clearProducts();
    await clearCategories();
    await clearUsers();
  };

  beforeAll(connectTestDb);
  beforeEach(clearAll);
  afterAll(async () => {
    await clearAll();
    await disconnectTestDb();
  });

  const createSeller = async () => {
    const seller = await createUser({ role: UserRole.SELLER });
    return {
      id: seller.getId() as string,
      authorization: `Bearer ${tokenFor(seller)}`,
    };
  };

  const bearerFor = async (role: UserRole) => `Bearer ${tokenFor(await createUser({ role }))}`;

  const buildBody = async (overrides: Record<string, unknown> = {}) => {
    const category = await createCategory();
    return {
      sku: 'SKU-NEW',
      name: 'Cuaderno',
      description: 'Rayado',
      salePrice: 1500,
      stock: 5,
      categoryId: category.getId(),
      ...overrides,
    };
  };

  describe('GET /api/products', () => {
    it('Debería listar solo productos activos sin token, con categoría y paginación', async () => {
      await createProduct();
      await createProduct();
      const inactive = await createProduct();
      await ProductModel.findByIdAndUpdate(inactive.getId(), {
        isActive: false,
      });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].category.name).toBeDefined();
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('Debería paginar con page y limit', async () => {
      for (let i = 0; i < 5; i++) await createProduct();

      const res = await request(app).get('/api/products?page=3&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toMatchObject({
        page: 3,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('Debería usar valores por defecto si page o limit son inválidos', async () => {
      await createProduct();

      const res = await request(app).get('/api/products?page=abc&limit=-4');

      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    });

    it('Debería filtrar por category', async () => {
      const category = await createCategory();
      await createProduct({ categoryId: category.getId() });
      await createProduct();

      const res = await request(app).get(`/api/products?category=${category.getId()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].categoryId).toBe(category.getId());
    });

    it('Debería buscar por texto con q', async () => {
      await createProduct({ name: 'Lapicera azul', sku: 'LAP-1' });
      await createProduct({ name: 'Cuaderno', sku: 'CUA-1' });

      const res = await request(app).get('/api/products?q=lapicera');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Lapicera azul');
    });
  });

  describe('GET /api/products/:id', () => {
    it('Debería devolver el producto activo con su categoría sin token', async () => {
      const product = await createProduct();

      const res = await request(app).get(`/api/products/${product.getId()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(product.getId());
      expect(res.body.data.category.id).toBe(product.getCategoryId());
    });

    it('Debería responder 404 si el producto está inactivo', async () => {
      const product = await createProduct();
      await ProductModel.findByIdAndUpdate(product.getId(), {
        isActive: false,
      });

      const res = await request(app).get(`/api/products/${product.getId()}`);

      expect(res.status).toBe(404);
    });

    it('Debería responder 404 si no existe o el id es inválido', async () => {
      const missing = await request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
      const invalid = await request(app).get('/api/products/no-es-un-id');

      expect(missing.status).toBe(404);
      expect(invalid.status).toBe(404);
    });
  });

  describe('POST /api/products', () => {
    it('Debería responder 401 sin token', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(await buildBody());

      expect(res.status).toBe(401);
    });

    it.each([UserRole.CLIENT, UserRole.ADMIN])('Debería responder 403 para un %s', async (role) => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', await bearerFor(role))
        .send(await buildBody());

      expect(res.status).toBe(403);
      expect(await ProductModel.countDocuments()).toBe(0);
    });

    it('Debería crear el producto asignando el sellerId desde el token', async () => {
      const seller = await createSeller();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', seller.authorization)
        .send(await buildBody());

      expect(res.status).toBe(201);
      expect(res.body.data.sellerId).toBe(seller.id);
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.category.name).toBeDefined();
      expect(await ProductModel.countDocuments()).toBe(1);
    });

    it('Debería ignorar un sellerId enviado en el body', async () => {
      const seller = await createSeller();
      const other = await createSeller();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', seller.authorization)
        .send(await buildBody({ sellerId: other.id }));

      expect(res.status).toBe(201);
      expect(res.body.data.sellerId).toBe(seller.id);
    });

    it('Debería responder 400 con detalles si los datos son inválidos', async () => {
      const seller = await createSeller();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', seller.authorization)
        .send(await buildBody({ salePrice: 0, stock: -1, name: '' }));

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('salePrice');
      expect(res.body.error).toHaveProperty('stock');
      expect(res.body.error).toHaveProperty('name');
    });

    it('Debería responder 400 si la categoría no existe', async () => {
      const seller = await createSeller();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', seller.authorization)
        .send(await buildBody({ categoryId: new mongoose.Types.ObjectId() }));

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('categoryId');
    });

    it('Debería responder 400 con SKU duplicado', async () => {
      const seller = await createSeller();
      await createProduct({ sku: 'SKU-NEW' });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', seller.authorization)
        .send(await buildBody());

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('sku');
    });
  });

  describe('GET /api/products/mine', () => {
    it('Debería responder 401 sin token y 403 para un CLIENT', async () => {
      const withoutToken = await request(app).get('/api/products/mine');
      const asClient = await request(app)
        .get('/api/products/mine')
        .set('Authorization', await bearerFor(UserRole.CLIENT));

      expect(withoutToken.status).toBe(401);
      expect(asClient.status).toBe(403);
    });

    it('Debería listar solo los productos del vendedor, activos e inactivos', async () => {
      const seller = await createSeller();
      await createProduct({ sellerId: seller.id });
      const inactive = await createProduct({ sellerId: seller.id });
      await ProductModel.findByIdAndUpdate(inactive.getId(), {
        isActive: false,
      });
      await createProduct();

      const res = await request(app).get('/api/products/mine').set('Authorization', seller.authorization);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      const activeFlags = res.body.data.map((product: { isActive: boolean }) => product.isActive);
      expect(activeFlags).toContain(true);
      expect(activeFlags).toContain(false);
    });

    it('No debería confundir "mine" con un id de producto', async () => {
      const seller = await createSeller();

      const res = await request(app).get('/api/products/mine').set('Authorization', seller.authorization);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('Debería responder 401 sin token', async () => {
      const product = await createProduct();

      const res = await request(app).put(`/api/products/${product.getId()}`).send({ name: 'Nuevo' });

      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un CLIENT', async () => {
      const product = await createProduct();

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', await bearerFor(UserRole.CLIENT))
        .send({ name: 'Nuevo' });

      expect(res.status).toBe(403);
    });

    it('Debería actualizar el producto para el vendedor dueño', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization)
        .send({ name: 'Nuevo nombre', stock: 99 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Nuevo nombre');
      expect(res.body.data.stock).toBe(99);
      expect(res.body.data.sku).toBe(product.getSku());

      const stored = await ProductModel.findById(product.getId());
      expect(stored?.name).toBe('Nuevo nombre');
    });

    it('Debería responder 404 y no modificar el producto de otro vendedor', async () => {
      const owner = await createSeller();
      const other = await createSeller();
      const product = await createProduct({ sellerId: owner.id });

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', other.authorization)
        .send({ name: 'Hackeado' });

      expect(res.status).toBe(404);
      const stored = await ProductModel.findById(product.getId());
      expect(stored?.name).toBe(product.getName());
    });

    it('Debería responder 404 si no existe, es inválido o está inactivo', async () => {
      const seller = await createSeller();
      const inactive = await createProduct({ sellerId: seller.id });
      await ProductModel.findByIdAndUpdate(inactive.getId(), {
        isActive: false,
      });

      const ids = [new mongoose.Types.ObjectId().toString(), 'no-es-un-id', inactive.getId() as string];
      for (const id of ids) {
        const res = await request(app)
          .put(`/api/products/${id}`)
          .set('Authorization', seller.authorization)
          .send({ name: 'Nuevo' });
        expect(res.status).toBe(404);
      }
    });

    it('Debería responder 400 si los cambios son inválidos', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization)
        .send({ salePrice: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('salePrice');
    });

    it('Debería responder 400 si la nueva categoría no existe', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization)
        .send({ categoryId: new mongoose.Types.ObjectId() });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('categoryId');
    });

    it('Debería permitir cambiar de categoría', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });
      const newCategory = await createCategory({ name: 'Nueva' });

      const res = await request(app)
        .put(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization)
        .send({ categoryId: newCategory.getId() });

      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe('Nueva');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('Debería responder 401 sin token y 403 para un CLIENT', async () => {
      const product = await createProduct();

      const withoutToken = await request(app).delete(`/api/products/${product.getId()}`);
      const asClient = await request(app)
        .delete(`/api/products/${product.getId()}`)
        .set('Authorization', await bearerFor(UserRole.CLIENT));

      expect(withoutToken.status).toBe(401);
      expect(asClient.status).toBe(403);
    });

    it('Debería hacer borrado lógico para el vendedor dueño', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });

      const res = await request(app)
        .delete(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization);

      expect(res.status).toBe(200);
      const stored = await ProductModel.findById(product.getId());
      expect(stored).not.toBeNull();
      expect(stored?.isActive).toBe(false);

      const publicRes = await request(app).get(`/api/products/${product.getId()}`);
      expect(publicRes.status).toBe(404);

      const mine = await request(app).get('/api/products/mine').set('Authorization', seller.authorization);
      expect(mine.body.data).toHaveLength(1);
      expect(mine.body.data[0].isActive).toBe(false);
    });

    it('Debería responder 404 y no desactivar el producto de otro vendedor', async () => {
      const owner = await createSeller();
      const other = await createSeller();
      const product = await createProduct({ sellerId: owner.id });

      const res = await request(app)
        .delete(`/api/products/${product.getId()}`)
        .set('Authorization', other.authorization);

      expect(res.status).toBe(404);
      const stored = await ProductModel.findById(product.getId());
      expect(stored?.isActive).toBe(true);
    });

    it('Debería responder 404 al eliminar dos veces o con un id inexistente', async () => {
      const seller = await createSeller();
      const product = await createProduct({ sellerId: seller.id });

      await request(app).delete(`/api/products/${product.getId()}`).set('Authorization', seller.authorization);
      const second = await request(app)
        .delete(`/api/products/${product.getId()}`)
        .set('Authorization', seller.authorization);
      const missing = await request(app)
        .delete(`/api/products/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', seller.authorization);

      expect(second.status).toBe(404);
      expect(missing.status).toBe(404);
    });
  });
});
