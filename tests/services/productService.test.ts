import { ResourceNotFoundError, ValidationError } from '../../src/errors/DomainErrors';
import { ICategoryRepository } from '../../src/interfaces/categoryRepository';
import { IProductRepository } from '../../src/interfaces/productRepository';
import { Category } from '../../src/models/category';
import { Product, ProductProps } from '../../src/models/product';
import { ProductService } from '../../src/services/productService';

const SELLER_ID = 'seller-1';
const OTHER_SELLER_ID = 'seller-2';
const CATEGORY_ID = 'category-1';

const buildProductRepositoryMock = (): jest.Mocked<IProductRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByIdAndSellerId: jest.fn(),
  findPaginated: jest.fn(),
  findBySellerId: jest.fn(),
  decrementStock: jest.fn(),
  existsByCategoryId: jest.fn(),
});

const buildCategoryRepositoryMock = (): jest.Mocked<ICategoryRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
});

const buildProduct = (overrides: ProductProps = {}): Product => {
  const product = new Product({
    sku: 'SKU-1',
    name: 'Cuaderno',
    description: 'Rayado',
    salePrice: 1500,
    stock: 5,
    categoryId: CATEGORY_ID,
    sellerId: SELLER_ID,
    ...overrides,
  });
  product.assignId('product-1');
  return product;
};

const buildCategory = (): Category => {
  const category = new Category({ name: 'Útiles' });
  category.assignId(CATEGORY_ID);
  return category;
};

describe('ProductService', () => {
  let productRepository: jest.Mocked<IProductRepository>;
  let categoryRepository: jest.Mocked<ICategoryRepository>;
  let service: ProductService;

  beforeEach(() => {
    productRepository = buildProductRepositoryMock();
    categoryRepository = buildCategoryRepositoryMock();
    categoryRepository.findById.mockResolvedValue(buildCategory());
    service = new ProductService(productRepository, categoryRepository);
  });

  describe('create', () => {
    const dto = {
      sku: 'SKU-1',
      name: 'Cuaderno',
      description: 'Rayado',
      salePrice: 1500,
      stock: 5,
      categoryId: CATEGORY_ID,
    };

    it('Debería asignar el vendedor recibido, guardar y devolver el producto con su categoría', async () => {
      const product = await service.create(dto, SELLER_ID);

      expect(product.getSellerId()).toBe(SELLER_ID);
      expect(product.getCategory()?.getName()).toBe('Útiles');
      expect(productRepository.save).toHaveBeenCalledWith(product);
    });

    it('Debería lanzar ValidationError sin guardar si los datos son inválidos', async () => {
      await expect(service.create({ ...dto, salePrice: 0 }, SELLER_ID)).rejects.toBeInstanceOf(ValidationError);
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('Debería lanzar ValidationError sobre categoryId si la categoría no existe', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      const error = await service.create(dto, SELLER_ID).catch((err) => err);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveProperty('categoryId');
      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      productRepository.findPaginated.mockResolvedValue({ items: [buildProduct()], total: 25 });
    });

    it('Debería aplicar valores por defecto y calcular totalPages', async () => {
      const page = await service.getAll({});

      expect(productRepository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        categoryId: undefined,
        searchText: undefined,
      });
      expect(page).toMatchObject({ total: 25, page: 1, limit: 10, totalPages: 3 });
    });

    it('Debería pasar los filtros al repositorio', async () => {
      await service.getAll({ page: 2, limit: 5, categoryId: CATEGORY_ID, searchText: 'cua' });

      expect(productRepository.findPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        categoryId: CATEGORY_ID,
        searchText: 'cua',
      });
    });

    it('Debería normalizar page y limit inválidos y limitar el máximo', async () => {
      await service.getAll({ page: -3, limit: 0 });
      expect(productRepository.findPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 10 }));

      await service.getAll({ page: Number.NaN, limit: 5000 });
      expect(productRepository.findPaginated).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 100 }),
      );
    });
  });

  describe('getActiveById', () => {
    it('Debería devolver el producto activo', async () => {
      const product = buildProduct();
      productRepository.findById.mockResolvedValue(product);
      await expect(service.getActiveById('product-1')).resolves.toBe(product);
    });

    it('Debería lanzar ResourceNotFoundError si no existe', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(service.getActiveById('x')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('Debería lanzar ResourceNotFoundError si está inactivo', async () => {
      const product = buildProduct();
      product.deactivate();
      productRepository.findById.mockResolvedValue(product);
      await expect(service.getActiveById('product-1')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('getBySeller', () => {
    it('Debería devolver lo que entrega el repositorio', async () => {
      const list = [buildProduct()];
      productRepository.findBySellerId.mockResolvedValue(list);
      await expect(service.getBySeller(SELLER_ID)).resolves.toBe(list);
      expect(productRepository.findBySellerId).toHaveBeenCalledWith(SELLER_ID);
    });
  });

  describe('update', () => {
    it('Debería actualizar y guardar si el usuario es el vendedor dueño', async () => {
      const product = buildProduct();
      productRepository.findByIdAndSellerId.mockResolvedValue(product);

      const updated = await service.update('product-1', { name: 'Nuevo', stock: 20 }, SELLER_ID);

      expect(updated.getName()).toBe('Nuevo');
      expect(updated.getStock()).toBe(20);
      expect(updated.getCategory()).toBeDefined();
      expect(productRepository.save).toHaveBeenCalledWith(product);
      expect(productRepository.findByIdAndSellerId).toHaveBeenCalledWith('product-1', SELLER_ID);
    });

    it('Debería lanzar ResourceNotFoundError sin guardar si el usuario no es el dueño', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(null);

      await expect(service.update('product-1', { name: 'Nuevo' }, OTHER_SELLER_ID)).rejects.toBeInstanceOf(
        ResourceNotFoundError,
      );
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('Debería lanzar ResourceNotFoundError si no existe o está inactivo', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(null);
      await expect(service.update('x', {}, SELLER_ID)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('Debería lanzar ValidationError sin guardar si los cambios son inválidos', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(buildProduct());

      await expect(service.update('product-1', { stock: -1 }, SELLER_ID)).rejects.toBeInstanceOf(ValidationError);
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('Debería lanzar ValidationError si la nueva categoría no existe', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(buildProduct());
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.update('product-1', { categoryId: 'otra' }, SELLER_ID)).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('Debería desactivar el producto (borrado lógico) si el usuario es el dueño', async () => {
      const product = buildProduct();
      productRepository.findByIdAndSellerId.mockResolvedValue(product);

      await service.delete('product-1', SELLER_ID);

      expect(product.getIsActive()).toBe(false);
      expect(productRepository.save).toHaveBeenCalledWith(product);
      expect(productRepository.findByIdAndSellerId).toHaveBeenCalledWith('product-1', SELLER_ID);
    });

    it('Debería lanzar ResourceNotFoundError sin desactivar si el usuario no es el dueño', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(null);

      await expect(service.delete('product-1', OTHER_SELLER_ID)).rejects.toBeInstanceOf(ResourceNotFoundError);
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('Debería lanzar ResourceNotFoundError si no existe o ya estaba desactivado', async () => {
      productRepository.findByIdAndSellerId.mockResolvedValue(null);
      await expect(service.delete('x', SELLER_ID)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
