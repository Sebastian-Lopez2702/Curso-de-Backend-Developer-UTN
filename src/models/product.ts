import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { Category } from './category';
import { ProductErrorMessages } from './error-menssages/productErrorMessages';

export interface ProductProps {
  sku?: string;
  name?: string;
  description?: string;
  salePrice?: number;
  stock?: number;
  categoryId?: string;
  sellerId?: string;
  isActive?: boolean;
}

export interface ProductChanges {
  sku?: string;
  name?: string;
  description?: string;
  salePrice?: number;
  stock?: number;
  categoryId?: string;
}

const MIN_SALE_PRICE = 1;

export class Product {
  private id?: string;
  private sku: string;
  private name: string;
  private description: string;
  private salePrice: number;
  private stock: number;
  private categoryId: string;
  private sellerId: string;
  private isActive: boolean;
  private category?: Category;

  constructor(props: ProductProps) {
    this.validate(props);
    this.sku = (props.sku as string).trim();
    this.name = (props.name as string).trim();
    this.description = (props.description as string).trim();
    this.salePrice = props.salePrice as number;
    this.stock = props.stock as number;
    this.categoryId = (props.categoryId as string).trim();
    this.sellerId = (props.sellerId as string).trim();
    this.isActive = true;
    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }
  }

  public getId(): string | undefined {
    return this.id;
  }

  public getSku(): string {
    return this.sku;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getSalePrice(): number {
    return this.salePrice;
  }

  public getStock(): number {
    return this.stock;
  }

  public getCategoryId(): string {
    return this.categoryId;
  }

  public getSellerId(): string {
    return this.sellerId;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getCategory(): Category | undefined {
    return this.category;
  }

  public assignId(id: string): void {
    this.id = id;
  }

  public assignCategory(category: Category): void {
    this.category = category;
  }

  public isOwnedBy(userId: string): boolean {
    return this.sellerId === userId;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public update(changes: ProductChanges): void {
    const candidate: ProductProps = {
      sku: this.sku,
      name: this.name,
      description: this.description,
      salePrice: this.salePrice,
      stock: this.stock,
      categoryId: this.categoryId,
      sellerId: this.sellerId,
    };

    if (changes.sku !== undefined) candidate.sku = changes.sku;
    if (changes.name !== undefined) candidate.name = changes.name;
    if (changes.description !== undefined) candidate.description = changes.description;
    if (changes.salePrice !== undefined) candidate.salePrice = changes.salePrice;
    if (changes.stock !== undefined) candidate.stock = changes.stock;
    if (changes.categoryId !== undefined) candidate.categoryId = changes.categoryId;

    this.validate(candidate);

    this.sku = (candidate.sku as string).trim();
    this.name = (candidate.name as string).trim();
    this.description = (candidate.description as string).trim();
    this.salePrice = candidate.salePrice as number;
    this.stock = candidate.stock as number;

    const newCategoryId = (candidate.categoryId as string).trim();
    if (newCategoryId !== this.categoryId) {
      this.categoryId = newCategoryId;
      this.category = undefined;
    }
  }

  private validate(props: ProductProps): void {
    const errors: ErrorDetail[] = [];

    if (!this.isNonEmptyString(props.sku)) errors.push(ProductErrorMessages.SKU_REQUIRED());
    if (!this.isNonEmptyString(props.name)) errors.push(ProductErrorMessages.NAME_REQUIRED());
    if (!this.isNonEmptyString(props.description)) errors.push(ProductErrorMessages.DESCRIPTION_REQUIRED());

    if (typeof props.salePrice !== 'number' || !Number.isFinite(props.salePrice) || props.salePrice < MIN_SALE_PRICE) {
      errors.push(ProductErrorMessages.SALE_PRICE_INVALID(MIN_SALE_PRICE));
    }

    if (typeof props.stock !== 'number' || !Number.isInteger(props.stock) || props.stock < 0) {
      errors.push(ProductErrorMessages.STOCK_INVALID());
    }

    if (!this.isNonEmptyString(props.categoryId)) errors.push(ProductErrorMessages.CATEGORY_REQUIRED());
    if (!this.isNonEmptyString(props.sellerId)) errors.push(ProductErrorMessages.SELLER_REQUIRED());

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
