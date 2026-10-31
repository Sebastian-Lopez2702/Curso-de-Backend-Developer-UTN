import { env } from "./env";
import { logger } from "./logger";
import { IUserRepository } from "../interfaces/userRepository";
import { User, UserRole } from "../models/user";
import { UserRepository } from "../repositories/userRepository";

export const seedAdmin = async (userRepository: IUserRepository = new UserRepository()): Promise<void> => {
  if (await userRepository.existsByRole(UserRole.ADMIN)) return;

  const admin = new User({
    firstName: "Admin",
    lastName: "Sistema",
    dni: env.initialAdmin.dni,
    email: env.initialAdmin.email,
    password: env.initialAdmin.password,
    role: UserRole.ADMIN,
  });
  await userRepository.save(admin);
  logger.info("Usuario ADMIN inicial creado");
};

export const runSeeder = async (): Promise<void> => {
  await seedAdmin();
};
