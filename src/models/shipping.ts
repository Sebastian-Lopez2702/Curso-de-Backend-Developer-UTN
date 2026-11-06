export interface ShippingProps {
  address?: string;
  provinceId?: string;
  provinceName?: string;
  cost: number;
  trackingCode?: string;
}

export class Shipping {
  private address?: string;
  private provinceId?: string;
  private provinceName?: string;
  private cost: number;
  private trackingCode?: string;

  constructor(props: ShippingProps) {
    this.address = props.address?.trim();
    this.provinceId = props.provinceId?.trim();
    this.provinceName = props.provinceName?.trim();
    this.cost = props.cost;
    this.trackingCode = props.trackingCode?.trim();
  }

  public getAddress(): string | undefined {
    return this.address;
  }

  public getProvinceId(): string | undefined {
    return this.provinceId;
  }

  public getProvinceName(): string | undefined {
    return this.provinceName;
  }

  public getCost(): number {
    return this.cost;
  }

  public getTrackingCode(): string | undefined {
    return this.trackingCode;
  }

  public setTrackingCode(trackingCode: string): void {
    this.trackingCode = trackingCode.trim();
  }
}
