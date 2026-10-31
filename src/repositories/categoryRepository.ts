import { isValidObjectId } from "mongoose";
import { ValidationError } from "../errors/DomainErrors";
import { ICategoryRepository } from "../interfaces/categoryRepository";
import { Category } from "../models/category";
import { CategoryErrorMessages } from "../models/categoryErrorMessages";
import { CategoryModel, CategoryRecord } from "./schemas/categorySchema";

interface MongoDuplicateError {
  code?: number;
  keyPattern?: Record<string, number>;
}

export class CategoryRepository implements ICategoryRepository {
  public async save(category: Category): Promise<void> {
    try {
      const record = await CategoryModel.create({
        name: category.getName(),
        description: category.getDescription(),
      });
      category.assignId(record._id.toString());
    } catch (err) {
      throw this.translateError(err);
    }
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

  private translateError(err: unknown): unknown {
    const mongoError = err as MongoDuplicateError;
    if (mongoError?.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0] ?? "unknown";
      return new ValidationError([CategoryErrorMessages.DUPLICATED(field)]);
    }
    return err;
  }
}
