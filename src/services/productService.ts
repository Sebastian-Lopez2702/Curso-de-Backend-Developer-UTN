import { ResourceNotFoundError, ValidationError } from "../errors/DomainErrors";
import { CreateProductDto } from "../dtos/createProductDto";
import { ListProductsDto } from "../dtos/listProductsDto";
import { UpdateProductDto } from "../dtos/updateProductDto";
import { ICategoryRepository } from "../interfaces/categoryRepository";
import { IProductRepository } from "../interfaces/productRepository";
import { Product } from "../models/product";
import { ProductErrorMessages } from "../models/productErrorMessages";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  public async getAll(dto: ListProductsDto): Promise<ProductPage> {
    const page = this.normalizePage(dto.page);
    const limit = this.normalizeLimit(dto.limit);

    const result = await this.productRepository.findPaginated({
      page: page,
      limit: limit,
      categoryId: dto.categoryId,
      searchText: dto.searchText,
    });

    const totalPages = Math.ceil(result.total / limit);
    return { items: result.items, total: result.total, page: page, limit: limit, totalPages: totalPages };
  }

  public async getActiveById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (product === null || !product.getIsActive()) {
      throw new ResourceNotFoundError("Producto no encontrado");
    }
    return product;
  }

  public async getBySeller(sellerId: string): Promise<Product[]> {
    return this.productRepository.findBySellerId(sellerId);
  }

  public async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    const product = new Product({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      salePrice: dto.salePrice,
      stock: dto.stock,
      categoryId: dto.categoryId,
      sellerId: sellerId,
    });

    await this.attachExistingCategory(product);
    await this.productRepository.save(product);
    return product;
  }

  public async update(id: string, dto: UpdateProductDto, sellerId: string): Promise<Product> {
    const product = await this.findOwnedActiveProduct(id, sellerId);

    product.update({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      salePrice: dto.salePrice,
      stock: dto.stock,
      categoryId: dto.categoryId,
    });

    await this.attachExistingCategory(product);
    await this.productRepository.save(product);
    return product;
  }

  public async delete(id: string, sellerId: string): Promise<void> {
    const product = await this.findOwnedActiveProduct(id, sellerId);

    product.deactivate();
    await this.productRepository.save(product);
  }

  private async findOwnedActiveProduct(id: string, sellerId: string): Promise<Product> {
    const product = await this.productRepository.findByIdAndSellerId(id, sellerId);
    if (product === null) {
      throw new ResourceNotFoundError("Producto no encontrado");
    }
    return product;
  }

  private async attachExistingCategory(product: Product): Promise<void> {
    const category = await this.categoryRepository.findById(product.getCategoryId());
    if (category === null) {
      throw new ValidationError([ProductErrorMessages.CATEGORY_NOT_FOUND()]);
    }
    product.assignCategory(category);
  }

  private normalizePage(page: number | undefined): number {
    if (page === undefined || !Number.isInteger(page) || page < 1) {
      return DEFAULT_PAGE;
    }
    return page;
  }

  private normalizeLimit(limit: number | undefined): number {
    if (limit === undefined || !Number.isInteger(limit) || limit < 1) {
      return DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
      return MAX_LIMIT;
    }
    return limit;
  }
}
