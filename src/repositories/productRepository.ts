import { Types, isValidObjectId } from 'mongoose';
import { ValidationError } from '../errors/DomainErrors';
import { IProductRepository, PaginatedResult, ProductFilter } from '../interfaces/productRepository';
import { Category } from '../models/category';
import { Product } from '../models/product';
import { ProductErrorMessages } from '../models/productErrorMessages';
import { CategoryModel, CategoryRecord } from './schemas/categorySchema';
import { ProductModel, ProductRecord } from './schemas/productSchema';

const SPECIAL_REGEX_CHARACTERS = '.*+?^${}()|[]\\';

interface StoredProduct extends ProductRecord {
  _id: Types.ObjectId;
}

interface StoredCategory extends CategoryRecord {
  _id: Types.ObjectId;
}

export class ProductRepository implements IProductRepository {
  public async save(product: Product): Promise<void> {
    const data = {
      sku: product.getSku(),
      name: product.getName(),
      description: product.getDescription(),
      salePrice: product.getSalePrice(),
      stock: product.getStock(),
      categoryId: product.getCategoryId(),
      sellerId: product.getSellerId(),
      isActive: product.getIsActive(),
    };

    const id = product.getId();
    if (id === undefined) {
      const record = await ProductModel.create(data);
      product.assignId(record._id.toString());
    } else {
      await ProductModel.findByIdAndUpdate(id, data, { runValidators: true });
    }
  }

  public async findById(id: string): Promise<Product | null> {
    if (!isValidObjectId(id)) return null;

    const record = await ProductModel.findById(id);
    if (record === null) return null;

    const products = await this.toEntities([record]);
    return products[0];
  }

  public async findByIdAndSellerId(id: string, sellerId: string): Promise<Product | null> {
    if (!isValidObjectId(id) || !isValidObjectId(sellerId)) return null;

    const record = await ProductModel.findOne({
      _id: id,
      sellerId: sellerId,
      isActive: true,
    });
    if (record === null) return null;

    const products = await this.toEntities([record]);
    return products[0];
  }

  public async findPaginated(filter: ProductFilter): Promise<PaginatedResult<Product>> {
    const page = Math.max(1, Math.floor(filter.page));
    const limit = Math.max(1, Math.floor(filter.limit));
    const recordsToSkip = (page - 1) * limit;

    const query: Record<string, unknown> = { isActive: true };

    if (filter.categoryId !== undefined) {
      if (!isValidObjectId(filter.categoryId)) {
        return { items: [], total: 0 };
      }
      query.categoryId = filter.categoryId;
    }

    if (filter.searchText !== undefined) {
      const searchText = filter.searchText.trim();
      if (searchText.length > 0) {
        const searchPattern = new RegExp(this.escapeRegex(searchText), 'i');
        query.$or = [{ name: searchPattern }, { sku: searchPattern }];
      }
    }

    const records = await ProductModel.find(query).sort({ createdAt: -1, _id: -1 }).skip(recordsToSkip).limit(limit);
    const total = await ProductModel.countDocuments(query);

    const items = await this.toEntities(records);
    return { items, total };
  }

  public async findBySellerId(sellerId: string): Promise<Product[]> {
    if (!isValidObjectId(sellerId)) return [];

    const records = await ProductModel.find({ sellerId }).sort({ createdAt: -1, _id: -1 });
    return this.toEntities(records);
  }

  public async decrementStock(id: string, quantity: number): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError([ProductErrorMessages.QUANTITY_INVALID()]);
    }
    if (!isValidObjectId(id)) return false;

    const onlyIfStockIsEnough = { _id: id, isActive: true, stock: { $gte: quantity } };
    const quantityToSubtract = -quantity;
    const subtractStock = { $inc: { stock: quantityToSubtract } };

    const updated = await ProductModel.findOneAndUpdate(onlyIfStockIsEnough, subtractStock, { new: true });
    return updated !== null;
  }

  public async existsByCategoryId(categoryId: string): Promise<boolean> {
    if (!isValidObjectId(categoryId)) return false;

    const found = await ProductModel.exists({ categoryId });
    return found !== null;
  }

  private async toEntities(records: StoredProduct[]): Promise<Product[]> {
    const categoriesById = await this.findCategoriesById(records);

    const products: Product[] = [];
    for (const record of records) {
      const product = this.toEntity(record);
      const category = categoriesById.get(product.getCategoryId());
      if (category !== undefined) {
        product.assignCategory(category);
      }
      products.push(product);
    }
    return products;
  }

  private async findCategoriesById(records: StoredProduct[]): Promise<Map<string, Category>> {
    const categoryIds: string[] = [];
    for (const record of records) {
      const categoryId = record.categoryId.toString();
      if (!categoryIds.includes(categoryId)) {
        categoryIds.push(categoryId);
      }
    }

    const categoryRecords = await CategoryModel.find({ _id: { $in: categoryIds } });

    const categoriesById = new Map<string, Category>();
    for (const categoryRecord of categoryRecords) {
      const category = this.toCategoryEntity(categoryRecord);
      categoriesById.set(categoryRecord._id.toString(), category);
    }
    return categoriesById;
  }

  private toEntity(record: StoredProduct): Product {
    const product = new Product({
      sku: record.sku,
      name: record.name,
      description: record.description,
      salePrice: record.salePrice,
      stock: record.stock,
      categoryId: record.categoryId.toString(),
      sellerId: record.sellerId.toString(),
      isActive: record.isActive,
    });
    product.assignId(record._id.toString());
    return product;
  }

  private toCategoryEntity(record: StoredCategory): Category {
    let description: string | undefined = undefined;
    if (typeof record.description === 'string') {
      description = record.description;
    }

    const category = new Category({ name: record.name, description: description });
    category.assignId(record._id.toString());
    return category;
  }

  private escapeRegex(text: string): string {
    let escaped = '';
    for (const character of text) {
      if (SPECIAL_REGEX_CHARACTERS.includes(character)) {
        escaped += '\\';
      }
      escaped += character;
    }
    return escaped;
  }
}
