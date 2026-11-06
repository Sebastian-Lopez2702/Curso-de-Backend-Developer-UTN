import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { ProvinceErrorMessages } from './error-menssages/provinceErrorMessages';

export class Province {
  private id?: string;
  private name: string;
  private shippingCost: number;

  constructor(name?: string, shippingCost?: number) {
    this.validate(name, shippingCost);
    this.name = (name as string).trim();
    this.shippingCost = shippingCost as number;
  }

  public getId(): string | undefined {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getShippingCost(): number {
    return this.shippingCost;
  }

  public assignId(id: string): void {
    this.id = id;
  }

  public updateShippingCost(shippingCost?: number): void {
    if (typeof shippingCost !== 'number' || Number.isNaN(shippingCost) || shippingCost < 0) {
      throw new ValidationError([ProvinceErrorMessages.SHIPPING_COST_INVALID()]);
    }
    this.shippingCost = shippingCost;
  }

  private validate(name?: string, shippingCost?: number): void {
    const errors: ErrorDetail[] = [];

    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push(ProvinceErrorMessages.NAME_REQUIRED());
    }

    if (typeof shippingCost !== 'number' || Number.isNaN(shippingCost) || shippingCost < 0) {
      errors.push(ProvinceErrorMessages.SHIPPING_COST_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
