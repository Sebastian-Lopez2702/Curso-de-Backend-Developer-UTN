import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { InvoiceErrorMessages } from './error-messages/invoiceErrorMessages';

export interface InvoiceProps {
  invoiceType?: string;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  total?: number;
  date?: Date;
}

export class Invoice {
  private invoiceType: string;
  private subtotal: number;
  private tax: number;
  private shippingCost: number;
  private total: number;
  private date: Date;

  constructor(props: InvoiceProps) {
    this.validate(props);
    this.invoiceType = (props.invoiceType ?? 'B').trim();
    this.subtotal = props.subtotal as number;
    this.tax = props.tax as number;
    this.shippingCost = props.shippingCost as number;
    this.total = props.total as number;
    this.date = props.date ?? new Date();
  }

  public getInvoiceType(): string {
    return this.invoiceType;
  }

  public getSubtotal(): number {
    return this.subtotal;
  }

  public getTax(): number {
    return this.tax;
  }

  public getShippingCost(): number {
    return this.shippingCost;
  }

  public getTotal(): number {
    return this.total;
  }

  public getDate(): Date {
    return this.date;
  }

  private validate(props: InvoiceProps): void {
    const errors: ErrorDetail[] = [];

    if (
      props.invoiceType !== undefined &&
      (typeof props.invoiceType !== 'string' || props.invoiceType.trim().length === 0)
    ) {
      errors.push(InvoiceErrorMessages.INVOICE_TYPE_INVALID());
    }

    if (!this.isValidAmount(props.subtotal)) {
      errors.push(InvoiceErrorMessages.SUBTOTAL_INVALID());
    }

    if (!this.isValidAmount(props.tax)) {
      errors.push(InvoiceErrorMessages.TAX_INVALID());
    }

    if (!this.isValidAmount(props.shippingCost)) {
      errors.push(InvoiceErrorMessages.SHIPPING_COST_INVALID());
    }

    if (!this.isValidAmount(props.total)) {
      errors.push(InvoiceErrorMessages.TOTAL_INVALID());
    }

    if (props.date !== undefined && (!(props.date instanceof Date) || Number.isNaN(props.date.getTime()))) {
      errors.push(InvoiceErrorMessages.DATE_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private isValidAmount(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }
}
