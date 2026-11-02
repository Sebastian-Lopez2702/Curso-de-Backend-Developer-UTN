import mongoose from 'mongoose';
import { Category } from '../../src/models/category';
import { CategoryRepository } from '../../src/repositories/categoryRepository';
import { clearCategories, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createCategory } from '../helpers/factories';

describe('CategoryRepository', () => {
  const repository = new CategoryRepository();

  beforeAll(connectTestDb);
  beforeEach(clearCategories);
  afterAll(async () => {
    await clearCategories();
    await mongoose.connection.collection('products').deleteMany({});
    await disconnectTestDb();
  });

  it('Debería guardar y asignar el id a la entidad', async () => {
    const category = new Category({ name: 'Textos', description: 'Escolares' });
    await repository.save(category);
    expect(category.getId()).toBeDefined();
  });

  it('Debería propagar el error de clave duplicada sin traducirlo (lo traduce el service)', async () => {
    await createCategory({ name: 'Textos' });
    await expect(repository.save(new Category({ name: 'Textos' }))).rejects.toMatchObject({ code: 11000 });
  });

  it('Debería encontrar por id y devolver una entidad', async () => {
    const created = await createCategory();
    const found = await repository.findById(created.getId() as string);
    expect(found).toBeInstanceOf(Category);
    expect(found?.getName()).toBe(created.getName());
  });

  it('Debería devolver null con un id inválido o inexistente', async () => {
    expect(await repository.findById('no-es-un-id')).toBeNull();
    expect(await repository.findById(new mongoose.Types.ObjectId().toString())).toBeNull();
  });

  it('Debería listar las categorías ordenadas por nombre', async () => {
    await createCategory({ name: 'B' });
    await createCategory({ name: 'A' });
    const list = await repository.findAll();
    expect(list.map((c) => c.getName())).toEqual(['A', 'B']);
  });

  it('Debería eliminar por id', async () => {
    const created = await createCategory();
    expect(await repository.deleteById(created.getId() as string)).toBe(true);
    expect(await repository.deleteById(created.getId() as string)).toBe(false);
    expect(await repository.deleteById('no-es-un-id')).toBe(false);
  });

  it('Debería contar las categorías', async () => {
    await createCategory();
    await createCategory();
    expect(await repository.count()).toBe(2);
  });
});
