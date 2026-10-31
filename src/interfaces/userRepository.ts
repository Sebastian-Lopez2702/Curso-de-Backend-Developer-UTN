import { User, UserRole } from '../models/user';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  existsByRole(role: UserRole): Promise<boolean>;
}
