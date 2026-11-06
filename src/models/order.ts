import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { OrderErrorMessages } from './orderErrorMessages';
import { OrderItem, OrderItemProps } from './orderItems';
import { Invoice, InvoiceProps } from './invoice';
import { Shipping, ShippingProps } from './shipping';

export const OrderStatus = {
  CART: 'CART',
  PENDING_DISPATCH: 'PENDING_DISPATCH',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const ORDER_STATUSES = Object.values(OrderStatus);

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CART]: [OrderStatus.PENDING_DISPATCH],
  [OrderStatus.PENDING_DISPATCH]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface OrderProps {
  userId?: string;
  orderStatus?: OrderStatus;
  items?: OrderItem[] | OrderItemProps[];
  invoice?: Invoice | InvoiceProps;
  shipping?: Shipping | ShippingProps;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  private id?: string;
  private userId: string;
  private orderStatus: OrderStatus;
  private items: OrderItem[];
  private invoice?: Invoice;
  private shipping?: Shipping;
  private createdAt?: Date;
  private updatedAt?: Date;

  constructor(props: OrderProps) {
    this.validate(props);
    this.userId = (props.userId as string).trim();
    this.orderStatus = props.orderStatus ?? OrderStatus.CART;
    this.items = (props.items ?? []).map((item) => (item instanceof OrderItem ? item : new OrderItem(item)));
    if (props.invoice) {
      this.invoice = props.invoice instanceof Invoice ? props.invoice : new Invoice(props.invoice);
    }
    if (props.shipping) {
      this.shipping = props.shipping instanceof Shipping ? props.shipping : new Shipping(props.shipping);
    }
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public getId(): string | undefined {
    return this.id;
  }

  public assignId(id: string): void {
    this.id = id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getOrderStatus(): OrderStatus {
    return this.orderStatus;
  }

  public getItems(): OrderItem[] {
    return this.items;
  }

  public getInvoice(): Invoice | undefined {
    return this.invoice;
  }

  public setInvoice(invoice: Invoice): void {
    this.invoice = invoice;
  }

  public getShipping(): Shipping | undefined {
    return this.shipping;
  }

  public setShipping(shipping: Shipping): void {
    this.shipping = shipping;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public canTransitionTo(newStatus: OrderStatus): boolean {
    return VALID_TRANSITIONS[this.orderStatus]?.includes(newStatus) ?? false;
  }

  public changeStatus(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new ValidationError([OrderErrorMessages.INVALID_STATUS_TRANSITION(this.orderStatus, newStatus)]);
    }
    this.orderStatus = newStatus;
  }

  public addItem(itemProps: OrderItemProps): void {
    const existing = this.items.find((item) => item.getProductId() === itemProps.productId);
    if (existing) {
      existing.setQuantity(existing.getQuantity() + itemProps.quantity);
      if (itemProps.recordedSalePrice !== undefined) {
        existing.setRecordedSalePrice(itemProps.recordedSalePrice);
      }
      if (itemProps.sellerId !== undefined && !existing.getSellerId()) {
        existing.assignSellerId(itemProps.sellerId);
      }
    } else {
      this.items.push(new OrderItem(itemProps));
    }
  }

  public updateItemQuantity(productId: string, quantity: number): void {
    const item = this.items.find((i) => i.getProductId() === productId);
    if (!item) {
      throw new ValidationError([OrderErrorMessages.ITEM_NOT_FOUND()]);
    }
    item.setQuantity(quantity);
  }

  public removeItem(productId: string): void {
    const initialLength = this.items.length;
    this.items = this.items.filter((item) => item.getProductId() !== productId);
    if (this.items.length === initialLength) {
      throw new ValidationError([OrderErrorMessages.ITEM_NOT_FOUND()]);
    }
  }

  private validate(props: OrderProps): void {
    const errors: ErrorDetail[] = [];

    if (typeof props.userId !== 'string' || props.userId.trim().length === 0) {
      errors.push(OrderErrorMessages.USER_REQUIRED());
    }

    if (props.orderStatus !== undefined && !ORDER_STATUSES.includes(props.orderStatus)) {
      errors.push(OrderErrorMessages.INVALID_STATUS());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
