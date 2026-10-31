import { ConflictError, ResourceNotFoundError } from '../errors/DomainErrors';
import { CreateCategoryDto } from '../dtos/createCategoryDto';
import { ICategoryRepository } from '../interfaces/categoryRepository';
import { IProductRepository } from '../interfaces/productRepository';
import { Category } from '../models/category';

export class CategoryService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  public async getAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  public async create(dto: CreateCategoryDto): Promise<Category> {
    const category = new Category({
      name: dto.name,
      description: dto.description,
    });
    await this.categoryRepository.save(category);
    return category;
  }

  public async delete(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new ResourceNotFoundError('Categoría no encontrada');

    const isInUse = await this.productRepository.existsByCategoryId(id);
    if (isInUse) {
      throw new ConflictError('No se puede eliminar la categoría porque tiene productos asociados');
    }

    await this.categoryRepository.deleteById(id);
  }
}
