export interface InvoiceProps {
  invoiceType?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
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
    this.invoiceType = props.invoiceType ?? 'B';
    this.subtotal = props.subtotal;
    this.tax = props.tax;
    this.shippingCost = props.shippingCost;
    this.total = props.total;
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
}
