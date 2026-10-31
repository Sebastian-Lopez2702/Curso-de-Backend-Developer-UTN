import request from 'supertest';
import { app } from '../src/app';

describe('GET / - Estado de la API', () => {
  it('Debería responder con success true', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Debería responder 404 en rutas inexistentes', async () => {
    const res = await request(app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
