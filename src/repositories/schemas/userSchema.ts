import bcrypt from 'bcrypt';
import { Schema, Types, model } from 'mongoose';
import { env } from '../../config/env';
import { USER_ROLES, UserRole } from '../../models/user';

const SALT_ROUNDS = env.bycryptRounds;

export interface UserRecord {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  savedAddresses: {
    street: string;
    number: string;
    city: string;
    provinceId: Types.ObjectId;
    zipCode: string;
  }[];
}

const savedAddressSchema = new Schema({
  street: { type: String, required: true },
  number: { type: String, required: true },
  city: { type: String, required: true },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province', required: true },
  zipCode: { type: String, required: true },
});

const userSchema = new Schema<UserRecord>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dni: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, default: UserRole.CLIENT, index: true },
    savedAddresses: { type: [savedAddressSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

export const UserModel = model<UserRecord>('User', userSchema);
