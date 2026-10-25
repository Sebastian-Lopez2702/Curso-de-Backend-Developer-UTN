import { connectDB, disconnectDB } from "../../src/config/db";
import { UserModel } from "../../src/repositories/schemas/userSchema";

export const connectTestDb = connectDB;
export const disconnectTestDb = disconnectDB;

export const clearUsers = async (): Promise<void> => {
  await UserModel.deleteMany({});
};
