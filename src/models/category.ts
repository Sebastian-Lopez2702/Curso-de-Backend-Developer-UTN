import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { CategoryErrorMessages } from './categoryErrorMessages';

export interface CategoryProps {
  name?: string;
  description?: string;
}

export class Category {
  private id?: string;
  private name: string;
  private description?: string;

  constructor(props: CategoryProps) {
    this.validate(props);
    this.name = (props.name as string).trim();
    this.description = props.description?.trim();
  }

  public getId(): string | undefined {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public assignId(id: string): void {
    this.id = id;
  }

  private validate(props: CategoryProps): void {
    const errors: ErrorDetail[] = [];

    if (typeof props.name !== 'string' || props.name.trim().length === 0) {
      errors.push(CategoryErrorMessages.NAME_REQUIRED());
    }

    if (props.description !== undefined && typeof props.description !== 'string') {
      errors.push(CategoryErrorMessages.DESCRIPTION_INVALID());
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
