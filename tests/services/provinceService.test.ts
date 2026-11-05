import { ResourceNotFoundError, ValidationError } from '../../src/errors/DomainErrors';
import { IProvinceRepository } from '../../src/interfaces/provinceRepository';
import { Province } from '../../src/models/province';
import { ProvinceService } from '../../src/services/provinceService';

const buildRepositoryMock = (): jest.Mocked<IProvinceRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
});

describe('ProvinceService', () => {
  let repository: jest.Mocked<IProvinceRepository>;
  let service: ProvinceService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    service = new ProvinceService(repository);
  });

  describe('getAll', () => {
    it('Debería devolver lo que entrega el repositorio', async () => {
      const list = [new Province('A', 1)];
      repository.findAll.mockResolvedValue(list);
      await expect(service.getAll()).resolves.toBe(list);
    });
  });

  describe('updateShippingCost', () => {
    it('Debería lanzar ResourceNotFoundError si no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.updateShippingCost('1', { shippingCost: 10 })).rejects.toBeInstanceOf(ResourceNotFoundError);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('Debería actualizar el costo y guardar', async () => {
      const province = new Province('A', 1);
      repository.findById.mockResolvedValue(province);

      const result = await service.updateShippingCost('1', { shippingCost: 50 });
      expect(result.getShippingCost()).toBe(50);
      expect(repository.save).toHaveBeenCalledWith(province);
    });

    it('Debería lanzar ValidationError sin guardar si el costo es inválido', async () => {
      repository.findById.mockResolvedValue(new Province('A', 1));
      await expect(service.updateShippingCost('1', { shippingCost: -1 })).rejects.toBeInstanceOf(ValidationError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
