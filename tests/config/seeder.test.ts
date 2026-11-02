import { env } from '../../src/config/env';
import { INITIAL_CATEGORIES, runSeeder, seedAdmin, seedCategories } from '../../src/config/seeder';
import { UserRole } from '../../src/models/user';
import { CategoryRepository } from '../../src/repositories/categoryRepository';
import { UserRepository } from '../../src/repositories/userRepository';
import { clearCategories, clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createCategory, createUser } from '../helpers/factories';

describe('Seeder', () => {
  const userRepository = new UserRepository();
  const categoryRepository = new CategoryRepository();

  beforeAll(connectTestDb);
  beforeEach(async () => {
    await clearUsers();
    await clearCategories();
  });
  afterAll(async () => {
    await clearUsers();
    await clearCategories();
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

  describe('runSeeder', () => {
    it('Debería ejecutar tanto el seeder de Admin como el de Categorías', async () => {
      await runSeeder(userRepository, categoryRepository);

      const admin = await userRepository.findByEmail(env.initialAdmin.email);
      expect(admin?.isAdmin()).toBe(true);

      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toBe(INITIAL_CATEGORIES.length);
    });
  });
});
