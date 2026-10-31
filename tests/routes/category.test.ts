import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';
import { UserRole } from '../../src/models/user';
import { CategoryModel } from '../../src/repositories/schemas/categorySchema';
import { clearCategories, clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createCategory, createUser, tokenFor } from '../helpers/factories';

describe('Categoría', () => {
  beforeAll(connectTestDb);
  beforeEach(async () => {
    await clearCategories();
    await clearUsers();
    await mongoose.connection.collection('products').deleteMany({});
  });
  afterAll(async () => {
    await clearCategories();
    await clearUsers();
    await mongoose.connection.collection('products').deleteMany({});
    await disconnectTestDb();
  });

  const bearer = async (role: UserRole) => `Bearer ${tokenFor(await createUser({ role }))}`;

  describe('GET /api/categories', () => {
    it('Debería listar las categorías sin necesidad de token', async () => {
      await createCategory({ name: 'B' });
      await createCategory({ name: 'A' });
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(['A', 'B']);
      expect(res.body.data[0].id).toBeDefined();
    });

    it('Debería devolver una lista vacía si no hay categorías', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /api/categories', () => {
    const body = { name: 'Textos Escolares', description: 'Libros de texto' };

    it('Debería responder 401 sin token', async () => {
      const res = await request(app).post('/api/categories').send(body);
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un CLIENT', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', await bearer(UserRole.CLIENT))
        .send(body);
      expect(res.status).toBe(403);
    });

    it('Debería responder 403 para un SELLER', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', await bearer(UserRole.SELLER))
        .send(body);
      expect(res.status).toBe(403);
    });

    it('Debería crear la categoría para un ADMIN', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send(body);
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(body.name);
      expect(res.body.data.id).toBeDefined();
      expect(await CategoryModel.countDocuments()).toBe(1);
    });

    it('Debería responder 400 si falta el nombre', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send({ description: 'sin nombre' });
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('name');
    });

    it('Debería responder 400 con nombre duplicado', async () => {
      await createCategory({ name: body.name });
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('name');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('Debería responder 401 sin token', async () => {
      const category = await createCategory();
      const res = await request(app).delete(`/api/categories/${category.getId()}`);
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un SELLER', async () => {
      const category = await createCategory();
      const res = await request(app)
        .delete(`/api/categories/${category.getId()}`)
        .set('Authorization', await bearer(UserRole.SELLER));
      expect(res.status).toBe(403);
      expect(await CategoryModel.countDocuments()).toBe(1);
    });

    it('Debería eliminar la categoría para un ADMIN', async () => {
      const category = await createCategory();
      const res = await request(app)
        .delete(`/api/categories/${category.getId()}`)
        .set('Authorization', await bearer(UserRole.ADMIN));
      expect(res.status).toBe(200);
      expect(await CategoryModel.countDocuments()).toBe(0);
    });

    it('Debería responder 404 si la categoría no existe', async () => {
      const res = await request(app)
        .delete(`/api/categories/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', await bearer(UserRole.ADMIN));
      expect(res.status).toBe(404);
    });

    it('Debería responder 404 con un id inválido', async () => {
      const res = await request(app)
        .delete('/api/categories/no-es-un-id')
        .set('Authorization', await bearer(UserRole.ADMIN));
      expect(res.status).toBe(404);
    });
  });
});
