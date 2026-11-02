import mongoose from 'mongoose';
import { Province } from '../../src/models/province';
import { ProvinceRepository } from '../../src/repositories/provinceRepository';
import { clearProvinces, connectTestDb, disconnectTestDb } from '../helpers/db';
import { createProvince } from '../helpers/factories';

describe('ProvinceRepository', () => {
  const repository = new ProvinceRepository();

  beforeAll(connectTestDb);
  beforeEach(clearProvinces);
  afterAll(async () => {
    await clearProvinces();
    await disconnectTestDb();
  });

  it('Debería guardar y asignar el id a la entidad', async () => {
    const province = new Province('Salta', 4000);
    await repository.save(province);
    expect(province.getId()).toBeDefined();
  });

  it('Debería propagar el error de clave duplicada sin traducirlo (lo traduce el service)', async () => {
    await createProvince('Salta');
    await expect(repository.save(new Province('Salta', 1))).rejects.toMatchObject({ code: 11000 });
  });

  it('Debería actualizar el costo de envío de una provincia existente', async () => {
    const created = await createProvince('Salta', 100);
    created.updateShippingCost(999);
    await repository.save(created);

    const found = await repository.findById(created.getId() as string);
    expect(found?.getShippingCost()).toBe(999);
    expect(await repository.count()).toBe(1);
  });

  it('Debería encontrar por id y devolver una entidad', async () => {
    const created = await createProvince('Salta', 100);
    const found = await repository.findById(created.getId() as string);
    expect(found).toBeInstanceOf(Province);
    expect(found?.getName()).toBe('Salta');
    expect(found?.getShippingCost()).toBe(100);
  });

  it('Debería devolver null con un id inválido o inexistente', async () => {
    expect(await repository.findById('no-es-un-id')).toBeNull();
    expect(await repository.findById(new mongoose.Types.ObjectId().toString())).toBeNull();
  });

  it('Debería listar las provincias ordenadas por nombre', async () => {
    await createProvince('B');
    await createProvince('A');
    const list = await repository.findAll();
    expect(list.map((p) => p.getName())).toEqual(['A', 'B']);
  });

  it('Debería contar las provincias', async () => {
    await createProvince();
    await createProvince();
    expect(await repository.count()).toBe(2);
  });
});
