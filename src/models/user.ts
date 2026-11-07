import bcrypt from 'bcrypt';
import { ErrorDetail, ValidationError } from '../errors/DomainErrors';
import { UserErrorMessages } from './error-messages/userErrorMessages';

export const UserRole = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  SELLER: 'SELLER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLES = [UserRole.ADMIN, UserRole.CLIENT, UserRole.SELLER] as const;

export interface UserProps {
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export class User {
  private id?: string;
  private firstName: string;
  private lastName: string;
  private dni: string;
  private email: string;
  private phone?: string;
  private password: string;
  private role: UserRole;

  constructor(props: UserProps) {
    this.validate(props);
    this.firstName = (props.firstName as string).trim();
    this.lastName = (props.lastName as string).trim();
    this.dni = (props.dni as string).trim();
    this.email = (props.email as string).trim().toLowerCase();
    this.phone = props.phone?.trim();
    this.password = props.password as string;
    this.role = (props.role ?? UserRole.CLIENT) as UserRole;
  }

  public getId(): string | undefined {
    return this.id;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public getDni(): string {
    return this.dni;
  }

  public getEmail(): string {
    return this.email;
  }

  public getPhone(): string | undefined {
    return this.phone;
  }

  public getRole(): UserRole {
    return this.role;
  }

  public getPassword(): string {
    return this.password;
  }

  public assignId(id: string): void {
    this.id = id;
  }

  public assignPasswordHash(hash: string): void {
    this.password = hash;
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  private validate(props: UserProps): void {
    const errors: ErrorDetail[] = [];

    if (!this.isNonEmptyString(props.firstName)) errors.push(UserErrorMessages.FIRST_NAME_REQUIRED());
    if (!this.isNonEmptyString(props.lastName)) errors.push(UserErrorMessages.LAST_NAME_REQUIRED());
    if (!this.isNonEmptyString(props.dni)) errors.push(UserErrorMessages.DNI_REQUIRED());

    if (!this.isNonEmptyString(props.email)) {
      errors.push(UserErrorMessages.EMAIL_REQUIRED());
    } else if (!EMAIL_REGEX.test(props.email.trim())) {
      errors.push(UserErrorMessages.EMAIL_INVALID());
    }

    if (!this.isNonEmptyString(props.password)) {
      errors.push(UserErrorMessages.PASSWORD_REQUIRED());
    } else if (props.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(UserErrorMessages.PASSWORD_TOO_SHORT(MIN_PASSWORD_LENGTH));
    }

    if (props.phone !== undefined && typeof props.phone !== 'string') {
      errors.push(UserErrorMessages.PHONE_INVALID());
    }

    if (props.role !== undefined && !USER_ROLES.includes(props.role as UserRole)) {
      errors.push(UserErrorMessages.ROLE_INVALID(USER_ROLES));
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
