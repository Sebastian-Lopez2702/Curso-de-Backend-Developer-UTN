import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';
import { UserRole } from '../../src/models/user';
import { ProvinceRepository } from '../../src/repositories/provinceRepository';
import { clearProvinces, clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createProvince, createUser, tokenFor } from '../helpers/factories';

describe('Provincia', () => {
  beforeAll(connectTestDb);
  beforeEach(async () => {
    await clearProvinces();
    await clearUsers();
  });
  afterAll(async () => {
    await clearProvinces();
    await clearUsers();
    await disconnectTestDb();
  });

  const bearer = async (role: UserRole) => `Bearer ${tokenFor(await createUser({ role }))}`;

  describe('GET /api/provinces', () => {
    it('Debería listar las provincias sin necesidad de token', async () => {
      await createProvince('B', 200);
      await createProvince('A', 100);
      const res = await request(app).get('/api/provinces');
      expect(res.status).toBe(200);
      expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['A', 'B']);
      expect(res.body.data[0].id).toBeDefined();
      expect(res.body.data[0].shippingCost).toBe(100);
    });

    it('Debería devolver una lista vacía si no hay provincias', async () => {
      const res = await request(app).get('/api/provinces');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /api/provinces', () => {
    it('Debería responder 404 porque no existe endpoint POST (solo el seeder crea provincias)', async () => {
      const res = await request(app)
        .post('/api/provinces')
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send({ name: 'Salta', shippingCost: 100 });
      expect(res.status).toBe(404);
      expect(await new ProvinceRepository().count()).toBe(0);
    });
  });

  describe('PUT /api/provinces/:id', () => {
    it('Debería responder 401 sin token', async () => {
      const province = await createProvince('A', 100);
      const res = await request(app).put(`/api/provinces/${province.getId()}`).send({ shippingCost: 5 });
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un rol distinto de ADMIN', async () => {
      const province = await createProvince('A', 100);
      for (const role of [UserRole.CLIENT, UserRole.SELLER]) {
        const res = await request(app)
          .put(`/api/provinces/${province.getId()}`)
          .set('Authorization', await bearer(role))
          .send({ shippingCost: 5 });
        expect(res.status).toBe(403);
      }
      const stored = await new ProvinceRepository().findById(province.getId() as string);
      expect(stored?.getShippingCost()).toBe(100);
    });

    it('Debería actualizar el costo de envío para un ADMIN', async () => {
      const province = await createProvince('A', 100);
      const res = await request(app)
        .put(`/api/provinces/${province.getId()}`)
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send({ shippingCost: 4200.5 });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ id: province.getId(), name: 'A', shippingCost: 4200.5 });

      const stored = await new ProvinceRepository().findById(province.getId() as string);
      expect(stored?.getShippingCost()).toBe(4200.5);
    });

    it('Debería permitir un costo de envío igual a 0', async () => {
      const province = await createProvince('A', 100);
      const res = await request(app)
        .put(`/api/provinces/${province.getId()}`)
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send({ shippingCost: 0 });
      expect(res.status).toBe(200);
    });

    it('Debería responder 400 con un costo inválido o ausente', async () => {
      const province = await createProvince('A', 100);
      const admin = await bearer(UserRole.ADMIN);
      for (const body of [{ shippingCost: -1 }, { shippingCost: 'abc' }, {}]) {
        const res = await request(app).put(`/api/provinces/${province.getId()}`).set('Authorization', admin).send(body);
        expect(res.status).toBe(400);
      }
    });

    it('Debería ignorar el nombre: solo se modifica el costo de envío', async () => {
      const province = await createProvince('A', 100);
      const res = await request(app)
        .put(`/api/provinces/${province.getId()}`)
        .set('Authorization', await bearer(UserRole.ADMIN))
        .send({ name: 'Otro', shippingCost: 7 });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('A');
    });

    it('Debería responder 404 si la provincia no existe o el id es inválido', async () => {
      const admin = await bearer(UserRole.ADMIN);
      const missing = await request(app)
        .put(`/api/provinces/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', admin)
        .send({ shippingCost: 5 });
      expect(missing.status).toBe(404);

      const invalid = await request(app)
        .put('/api/provinces/no-es-un-id')
        .set('Authorization', admin)
        .send({ shippingCost: 5 });
      expect(invalid.status).toBe(404);
    });
  });
});
