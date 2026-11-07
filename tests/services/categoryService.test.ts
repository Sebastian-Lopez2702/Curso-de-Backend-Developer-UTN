import { ConflictError, ResourceNotFoundError, ValidationError } from '../../src/errors/DomainErrors';
import { ICategoryRepository } from '../../src/interfaces/categoryRepository';
import { IProductRepository } from '../../src/interfaces/productRepository';
import { Category } from '../../src/models/category';
import { CategoryService } from '../../src/services/categoryService';

const buildRepositoryMock = (): jest.Mocked<ICategoryRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
});

const buildProductRepositoryMock = (): jest.Mocked<IProductRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByIdAndSellerId: jest.fn(),
  findPaginated: jest.fn(),
  findBySellerId: jest.fn(),
  decrementStock: jest.fn(),
  incrementStock: jest.fn(),
  existsByCategoryId: jest.fn(),
});

describe('CategoryService', () => {
  let repository: jest.Mocked<ICategoryRepository>;
  let productRepository: jest.Mocked<IProductRepository>;
  let service: CategoryService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    productRepository = buildProductRepositoryMock();
    service = new CategoryService(repository, productRepository);
  });

  describe('create', () => {
    it('Debería traducir el error de clave duplicada a ValidationError', async () => {
      repository.save.mockRejectedValue({ code: 11000, keyPattern: { name: 1 } });
      const error = await service.create({ name: 'Textos' }).catch((e) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveProperty('name');
    });

    it('Debería relanzar los errores que no son de clave duplicada', async () => {
      const failure = new Error('db caída');
      repository.save.mockRejectedValue(failure);
      await expect(service.create({ name: 'Textos' })).rejects.toBe(failure);
    });
    it('Debería guardar y devolver la categoría', async () => {
      const category = await service.create({
        name: 'Textos',
        description: 'Escolares',
      });
      expect(repository.save).toHaveBeenCalledWith(category);
      expect(category.getName()).toBe('Textos');
    });

    it('Debería lanzar ValidationError sin guardar si el nombre falta', async () => {
      await expect(service.create({})).rejects.toBeInstanceOf(ValidationError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('Debería devolver lo que entrega el repositorio', async () => {
      const list = [new Category({ name: 'A' })];
      repository.findAll.mockResolvedValue(list);
      await expect(service.getAll()).resolves.toBe(list);
    });
  });

  describe('delete', () => {
    it('Debería lanzar ResourceNotFoundError si no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.delete('1')).rejects.toBeInstanceOf(ResourceNotFoundError);
      expect(productRepository.existsByCategoryId).not.toHaveBeenCalled();
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('Debería lanzar ConflictError sin eliminar si hay productos que la usan', async () => {
      repository.findById.mockResolvedValue(new Category({ name: 'A' }));
      productRepository.existsByCategoryId.mockResolvedValue(true);

      await expect(service.delete('1')).rejects.toBeInstanceOf(ConflictError);
      expect(productRepository.existsByCategoryId).toHaveBeenCalledWith('1');
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('Debería eliminar la categoría si no está en uso', async () => {
      repository.findById.mockResolvedValue(new Category({ name: 'A' }));
      productRepository.existsByCategoryId.mockResolvedValue(false);

      await service.delete('1');
      expect(repository.deleteById).toHaveBeenCalledWith('1');
    });
  });
});
