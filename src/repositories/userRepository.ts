import { isValidObjectId } from 'mongoose';
import { IUserRepository } from '../interfaces/userRepository';
import { User, UserRole } from '../models/user';
import { UserModel, UserRecord } from './schemas/userSchema';

export class UserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const record = await UserModel.create({
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      dni: user.getDni(),
      email: user.getEmail(),
      phone: user.getPhone(),
      password: user.getPassword(),
      role: user.getRole(),
    });
    user.assignId(record._id.toString());
    user.assignPasswordHash(record.password);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await UserModel.findOne({ email: email.trim().toLowerCase() });
    return record ? this.toEntity(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) return null;
    const record = await UserModel.findById(id);
    return record ? this.toEntity(record) : null;
  }

  async findAll(): Promise<User[]> {
    const records = await UserModel.find().sort({ createdAt: -1 });
    return records.map((record) => this.toEntity(record));
  }

  async existsByRole(role: UserRole): Promise<boolean> {
    return (await UserModel.exists({ role })) !== null;
  }

  private toEntity(record: UserRecord & { _id: { toString(): string } }): User {
    const user = new User({
      firstName: record.firstName,
      lastName: record.lastName,
      dni: record.dni,
      email: record.email,
      phone: record.phone ?? undefined,
      password: record.password,
      role: record.role,
    });
    user.assignId(record._id.toString());
    return user;
  }
}
