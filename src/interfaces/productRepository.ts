import { Product } from '../models/product';

export interface ProductFilter {
  page: number;
  limit: number;
  categoryId?: string;
  searchText?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findByIdAndSellerId(id: string, sellerId: string): Promise<Product | null>;
  findPaginated(filter: ProductFilter): Promise<PaginatedResult<Product>>;
  findBySellerId(sellerId: string): Promise<Product[]>;
  decrementStock(id: string, quantity: number): Promise<Product | null>;
  incrementStock(id: string, quantity: number): Promise<boolean>;
  existsByCategoryId(categoryId: string): Promise<boolean>;
}
