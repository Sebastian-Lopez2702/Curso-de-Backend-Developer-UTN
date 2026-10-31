import request from 'supertest';
import { app } from '../../src/app';
import { UserRole } from '../../src/models/user';
import { UserModel } from '../../src/repositories/schemas/userSchema';
import { clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { DEFAULT_PASSWORD, buildUserProps, createUser, tokenFor } from '../helpers/factories';

describe('Usuario', () => {
  beforeAll(connectTestDb);
  beforeEach(clearUsers);
  afterAll(async () => {
    await clearUsers();
    await disconnectTestDb();
  });

  describe('POST /api/users/register - Registro de usuarios', () => {
    const register = (body: object) => request(app).post('/api/users/register').send(body);

    it('Debería registrar un CLIENT por defecto sin devolver la contraseña', async () => {
      const res = await register(buildUserProps());
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe(UserRole.CLIENT);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.password).toBeUndefined();
    });

    it('Debería permitir registrarse como SELLER', async () => {
      const res = await register(buildUserProps({ role: UserRole.SELLER }));
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe(UserRole.SELLER);
    });

    it('Debería guardar la contraseña hasheada en la base', async () => {
      const props = buildUserProps();
      await register(props);
      const record = await UserModel.findOne({ email: props.email });
      expect(record?.password).toMatch(/^\$2[aby]\$/);
    });

    it('Debería responder 403 si intenta registrarse como ADMIN', async () => {
      const res = await register(buildUserProps({ role: UserRole.ADMIN }));
      expect(res.status).toBe(403);
      expect(await UserModel.countDocuments()).toBe(0);
    });

    it('Debería responder 400 con un rol inválido', async () => {
      const res = await register(buildUserProps({ role: 'ROOT' }));
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('role');
    });

    it('Debería responder 400 con email duplicado', async () => {
      const existing = await createUser();
      const res = await register(buildUserProps({ email: existing.getEmail() }));
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('email');
    });

    it('Debería responder 400 con DNI duplicado', async () => {
      const existing = await createUser();
      const res = await register(buildUserProps({ dni: existing.getDni() }));
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('dni');
    });

    it('Debería responder 400 con email inválido', async () => {
      const res = await register(buildUserProps({ email: 'no-es-un-email' }));
      expect(res.status).toBe(400);
    });

    it('Debería responder 400 con contraseña corta', async () => {
      const res = await register(buildUserProps({ password: '123' }));
      expect(res.status).toBe(400);
    });

    it('Debería responder 400 si faltan campos obligatorios', async () => {
      const res = await register({ email: 'solo@example.com' });
      expect(res.status).toBe(400);
    });

    it('Debería responder 400 si el cuerpo es un JSON inválido', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Content-Type', 'application/json')
        .send('{ no es json');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/users/login - Inicio de sesión', () => {
    const login = (body: object) => request(app).post('/api/users/login').send(body);

    it('Debería devolver un token y el usuario sin contraseña', async () => {
      const user = await createUser();
      const res = await login({ email: user.getEmail(), password: DEFAULT_PASSWORD });
      expect(res.status).toBe(200);
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.user.email).toBe(user.getEmail());
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('Debería responder 401 con contraseña incorrecta', async () => {
      const user = await createUser();
      const res = await login({ email: user.getEmail(), password: 'incorrecta' });
      expect(res.status).toBe(401);
    });

    it('Debería responder 401 con un email inexistente', async () => {
      const res = await login({ email: 'nadie@example.com', password: DEFAULT_PASSWORD });
      expect(res.status).toBe(401);
    });

    it('Debería responder 400 si faltan credenciales', async () => {
      const res = await login({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/me - Perfil propio', () => {
    it('Debería responder 401 sin token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('Debería responder 401 con un token inválido', async () => {
      const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer token.falso');
      expect(res.status).toBe(401);
    });

    it('Debería devolver el perfil sin contraseña con un token válido', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokenFor(user)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.getEmail());
      expect(res.body.data.password).toBeUndefined();
    });

    it('Debería responder 404 si el usuario del token ya no existe', async () => {
      const user = await createUser();
      const token = tokenFor(user);
      await clearUsers();
      const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users - Listado (solo ADMIN)', () => {
    it('Debería responder 401 sin token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('Debería responder 403 para un CLIENT', async () => {
      const client = await createUser({ role: UserRole.CLIENT });
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor(client)}`);
      expect(res.status).toBe(403);
    });

    it('Debería responder 403 para un SELLER', async () => {
      const seller = await createUser({ role: UserRole.SELLER });
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor(seller)}`);
      expect(res.status).toBe(403);
    });

    it('Debería listar los usuarios para un ADMIN sin exponer contraseñas', async () => {
      const admin = await createUser({ role: UserRole.ADMIN });
      await createUser();
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor(admin)}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((u: { password?: string }) => u.password === undefined)).toBe(true);
    });
  });
});
