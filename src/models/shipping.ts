import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { ShippingErrorMessages } from './error-messages/shippingErrorMessages';

export interface ShippingProps {
  address?: string;
  provinceId?: string;
  provinceName?: string;
  cost?: number;
  trackingCode?: string;
}

export class Shipping {
  private address?: string;
  private provinceId?: string;
  private provinceName?: string;
  private cost: number;
  private trackingCode?: string;

  constructor(props: ShippingProps) {
    this.validate(props);
    this.address = props.address?.trim();
    this.provinceId = props.provinceId?.trim();
    this.provinceName = props.provinceName?.trim();
    this.cost = props.cost as number;
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
    if (typeof trackingCode !== 'string' || trackingCode.trim().length === 0) {
      throw new ValidationError([ShippingErrorMessages.TRACKING_CODE_INVALID()]);
    }
    this.trackingCode = trackingCode.trim();
  }

  private validate(props: ShippingProps): void {
    const errors: ErrorDetail[] = [];

    if (typeof props.cost !== 'number' || !Number.isFinite(props.cost) || props.cost < 0) {
      errors.push(ShippingErrorMessages.COST_INVALID());
    }

    if (props.address !== undefined && (typeof props.address !== 'string' || props.address.trim().length === 0)) {
      errors.push(ShippingErrorMessages.ADDRESS_INVALID());
    }

    if (
      props.provinceId !== undefined &&
      (typeof props.provinceId !== 'string' || props.provinceId.trim().length === 0)
    ) {
      errors.push(ShippingErrorMessages.PROVINCE_ID_INVALID());
    }

    if (
      props.provinceName !== undefined &&
      (typeof props.provinceName !== 'string' || props.provinceName.trim().length === 0)
    ) {
      errors.push(ShippingErrorMessages.PROVINCE_NAME_INVALID());
    }

    if (
      props.trackingCode !== undefined &&
      (typeof props.trackingCode !== 'string' || props.trackingCode.trim().length === 0)
    ) {
      errors.push(ShippingErrorMessages.TRACKING_CODE_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
