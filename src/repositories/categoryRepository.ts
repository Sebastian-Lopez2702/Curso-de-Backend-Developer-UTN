import { isValidObjectId } from 'mongoose';
import { ICategoryRepository } from '../interfaces/categoryRepository';
import { Category } from '../models/category';
import { CategoryModel, CategoryRecord } from './schemas/categorySchema';

export class CategoryRepository implements ICategoryRepository {
  public async save(category: Category): Promise<void> {
    const record = await CategoryModel.create({
      name: category.getName(),
      description: category.getDescription(),
    });
    category.assignId(record._id.toString());
  }

  public async findById(id: string): Promise<Category | null> {
    if (!isValidObjectId(id)) return null;
    const record = await CategoryModel.findById(id);
    return record ? this.toEntity(record) : null;
  }

  public async findAll(): Promise<Category[]> {
    const records = await CategoryModel.find().sort({ name: 1 });
    return records.map((record) => this.toEntity(record));
  }

  public async deleteById(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const deleted = await CategoryModel.findByIdAndDelete(id);
    return deleted !== null;
  }

  public async count(): Promise<number> {
    return CategoryModel.countDocuments();
  }

  private toEntity(record: CategoryRecord & { _id: { toString(): string } }): Category {
    const category = new Category({
      name: record.name,
      description: record.description ?? undefined,
    });
    category.assignId(record._id.toString());
    return category;
  }
}
