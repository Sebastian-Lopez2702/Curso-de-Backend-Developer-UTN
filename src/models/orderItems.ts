import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { OrderErrorMessages } from './error-menssages/orderErrorMessages';

export interface OrderItemProps {
  productId: string;
  quantity: number;
  recordedSalePrice?: number;
  sellerId?: string;
}

export class OrderItem {
  private productId: string;
  private quantity: number;
  private recordedSalePrice?: number;
  private sellerId?: string;

  constructor(props: OrderItemProps) {
    this.validate(props);
    this.productId = props.productId.trim();
    this.quantity = props.quantity;
    this.recordedSalePrice = props.recordedSalePrice;
    this.sellerId = props.sellerId?.trim();
  }

  public getProductId(): string {
    return this.productId;
  }

  public getQuantity(): number {
    return this.quantity;
  }

  public getRecordedSalePrice(): number | undefined {
    return this.recordedSalePrice;
  }

  public getSellerId(): string | undefined {
    return this.sellerId;
  }

  public setQuantity(quantity: number): void {
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError([OrderErrorMessages.QUANTITY_INVALID()]);
    }
    this.quantity = quantity;
  }

  public setRecordedSalePrice(price: number): void {
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      throw new ValidationError([OrderErrorMessages.PRICE_INVALID()]);
    }
    this.recordedSalePrice = price;
  }

  public assignSellerId(sellerId: string): void {
    this.sellerId = sellerId.trim();
  }

  private validate(props: OrderItemProps): void {
    const errors: ErrorDetail[] = [];

    if (typeof props.productId !== 'string' || props.productId.trim().length === 0) {
      errors.push(OrderErrorMessages.PRODUCT_REQUIRED());
    }

    if (typeof props.quantity !== 'number' || !Number.isInteger(props.quantity) || props.quantity <= 0) {
      errors.push(OrderErrorMessages.QUANTITY_INVALID());
    }

    if (
      props.recordedSalePrice !== undefined &&
      (typeof props.recordedSalePrice !== 'number' ||
        !Number.isFinite(props.recordedSalePrice) ||
        props.recordedSalePrice < 0)
    ) {
      errors.push(OrderErrorMessages.PRICE_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
