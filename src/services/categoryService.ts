import { ConflictError, ResourceNotFoundError, ValidationError } from '../errors/DomainErrors';
import { CreateCategoryDto } from '../dtos/createCategoryDto';
import { ICategoryRepository } from '../interfaces/categoryRepository';
import { IProductRepository } from '../interfaces/productRepository';
import { Category } from '../models/category';
import { CategoryErrorMessages } from '../models/error-menssages/categoryErrorMessages';
import { getDuplicatedField, isDuplicateKeyError } from '../utils/duplicateKey';

export class CategoryService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly productRepository: IProductRepository,
  ) { }

  public async getAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  public async create(dto: CreateCategoryDto): Promise<Category> {
    const category = new Category({
      name: dto.name,
      description: dto.description,
    });
    try {
      await this.categoryRepository.save(category);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const field = getDuplicatedField(err);
        throw new ValidationError([CategoryErrorMessages.DUPLICATED(field)]);
      }
      throw err;
    }
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
