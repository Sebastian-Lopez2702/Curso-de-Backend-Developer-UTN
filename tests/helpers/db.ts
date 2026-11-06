import { connectDB, disconnectDB } from '../../src/config/db';
import { CategoryModel } from '../../src/repositories/schemas/categorySchema';
import { OrderModel } from '../../src/repositories/schemas/orderSchema';
import { ProvinceModel } from '../../src/repositories/schemas/provinceSchema';
import { ProductModel } from '../../src/repositories/schemas/productSchema';
import { UserModel } from '../../src/repositories/schemas/userSchema';

export const connectTestDb = connectDB;
export const disconnectTestDb = disconnectDB;

export const clearUsers = async (): Promise<void> => {
  await UserModel.deleteMany({});
};

export const clearProducts = async (): Promise<void> => {
  await ProductModel.deleteMany({});
};

export const clearProvinces = async (): Promise<void> => {
  await ProvinceModel.deleteMany({});
};

export const clearCategories = async (): Promise<void> => {
  await CategoryModel.deleteMany({});
};

export const clearOrders = async (): Promise<void> => {
  await OrderModel.deleteMany({});
};
