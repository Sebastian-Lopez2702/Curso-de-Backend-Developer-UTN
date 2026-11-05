import { env } from '../../src/config/env';
import {
  INITIAL_CATEGORIES,
  INITIAL_PROVINCES,
  runSeeder,
  seedAdmin,
  seedCategories,
  seedProvinces,
} from '../../src/config/seeder';
import { UserRole } from '../../src/models/user';
import { CategoryRepository } from '../../src/repositories/categoryRepository';
import { ProvinceRepository } from '../../src/repositories/provinceRepository';
import { UserRepository } from '../../src/repositories/userRepository';
import { clearCategories, clearProvinces, clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createCategory, createProvince, createUser } from '../helpers/factories';

describe('Seeder', () => {
  const userRepository = new UserRepository();
  const categoryRepository = new CategoryRepository();
  const provinceRepository = new ProvinceRepository();

  beforeAll(connectTestDb);
  beforeEach(async () => {
    await clearUsers();
    await clearCategories();
    await clearProvinces();
  });
  afterAll(async () => {
    await clearUsers();
    await clearCategories();
    await clearProvinces();
    await disconnectTestDb();
  });

  describe('Admin inicial', () => {
    it('Debería crear el ADMIN con los datos del entorno si no existe ninguno', async () => {
      await seedAdmin(userRepository);
      const admin = await userRepository.findByEmail(env.initialAdmin.email);
      expect(admin?.isAdmin()).toBe(true);
      expect(await admin?.verifyPassword(env.initialAdmin.password)).toBe(true);
    });

    it('Debería ser idempotente: no crea un segundo ADMIN', async () => {
      await seedAdmin(userRepository);
      await seedAdmin(userRepository);
      expect(await userRepository.findAll()).toHaveLength(1);
    });

    it('No debería crear un ADMIN si ya existe uno', async () => {
      await createUser({ role: UserRole.ADMIN });
      await seedAdmin(userRepository);
      expect(await userRepository.findAll()).toHaveLength(1);
    });
  });

  describe('Categorías iniciales', () => {
    it('Debería crear las categorías iniciales si la colección está vacía', async () => {
      await seedCategories(categoryRepository);

      const count = await categoryRepository.count();
      expect(count).toBe(INITIAL_CATEGORIES.length);

      const categories = await categoryRepository.findAll();
      const names = categories.map((c) => c.getName());
      expect(names).toEqual(expect.arrayContaining(['Novelas', 'Utiles', 'Electrodomesticos', 'Papeleria']));

      for (const item of INITIAL_CATEGORIES) {
        const found = categories.find((c) => c.getName() === item.name);
        expect(found).toBeDefined();
        expect(found?.getDescription()).toBe(item.description);
        expect(found?.getId()).toBeDefined();
      }
    });

    it('Debería ser idempotente: no duplica categorías si se ejecuta nuevamente', async () => {
      await seedCategories(categoryRepository);
      await seedCategories(categoryRepository);

      expect(await categoryRepository.count()).toBe(INITIAL_CATEGORIES.length);
    });

    it('No debería crear categorías si la colección ya contiene al menos una categoría', async () => {
      await createCategory({ name: 'Existente', description: 'Categoría previa' });

      await seedCategories(categoryRepository);

      expect(await categoryRepository.count()).toBe(1);
      const all = await categoryRepository.findAll();
      expect(all[0].getName()).toBe('Existente');
    });
  });

  describe('Provincias iniciales', () => {
    it('Debería crear las provincias iniciales con los costos escalonados si la colección está vacía', async () => {
      await seedProvinces(provinceRepository);

      const count = await provinceRepository.count();
      expect(count).toBe(INITIAL_PROVINCES.length);

      const provinces = await provinceRepository.findAll();
      const names = provinces.map((p) => p.getName());
      expect(names).toEqual(
        expect.arrayContaining([
          'Ciudad Autónoma de Buenos Aires',
          'Buenos Aires',
          'Entre Ríos',
          'Santa Fe',
          'Córdoba',
          'La Pampa',
          'San Luis',
          'Corrientes',
          'Mendoza',
          'San Juan',
          'Chaco',
          'Santiago del Estero',
          'Misiones',
          'La Rioja',
          'Catamarca',
          'Tucumán',
          'Formosa',
          'Salta',
          'Jujuy',
          'Neuquén',
          'Río Negro',
          'Chubut',
          'Santa Cruz',
          'Tierra del Fuego',
        ]),
      );
    });

    it('Debería ser idempotente: no duplica provincias si se ejecuta nuevamente', async () => {
      await seedProvinces(provinceRepository);
      await seedProvinces(provinceRepository);

      expect(await provinceRepository.count()).toBe(INITIAL_PROVINCES.length);
    });

    it('No debería crear provincias si la colección ya contiene al menos una provincia', async () => {
      await createProvince('Mendoza', 6000);

      await seedProvinces(provinceRepository);

      expect(await provinceRepository.count()).toBe(1);
      const all = await provinceRepository.findAll();
      expect(all[0].getName()).toBe('Mendoza');
      expect(all[0].getShippingCost()).toBe(6000);
    });
  });

  describe('runSeeder', () => {
    it('Debería ejecutar los seeders de Admin, Provincias y Categorías', async () => {
      await runSeeder(userRepository, categoryRepository, provinceRepository);

      const admin = await userRepository.findByEmail(env.initialAdmin.email);
      expect(admin?.isAdmin()).toBe(true);

      const provinceCount = await provinceRepository.count();
      expect(provinceCount).toBe(INITIAL_PROVINCES.length);

      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toBe(INITIAL_CATEGORIES.length);
    });
  });
});
