import { connectDB, disconnectDB } from "../../src/config/db";
import { CategoryModel } from "../../src/repositories/schemas/categorySchema";
import { UserModel } from "../../src/repositories/schemas/userSchema";

export const connectTestDb = connectDB;
export const disconnectTestDb = disconnectDB;

export const clearUsers = async (): Promise<void> => {
  await UserModel.deleteMany({});
};

export const clearCategories = async (): Promise<void> => {
  await CategoryModel.deleteMany({});
};
