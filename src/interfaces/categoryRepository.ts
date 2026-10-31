import { Category } from "../models/category";

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  deleteById(id: string): Promise<boolean>;
  count(): Promise<number>;
}
