import { env } from './env';
import { logger } from './logger';
import { ICategoryRepository } from '../interfaces/categoryRepository';
import { IUserRepository } from '../interfaces/userRepository';
import { Category, CategoryProps } from '../models/category';
import { User, UserRole } from '../models/user';
import { CategoryRepository } from '../repositories/categoryRepository';
import { UserRepository } from '../repositories/userRepository';

export const INITIAL_CATEGORIES: CategoryProps[] = [
  { name: 'Novelas', description: 'Libros y novelas de diversos géneros' },
  { name: 'Utiles', description: 'Útiles escolares y de oficina' },
  { name: 'Electrodomesticos', description: 'Aparatos eléctricos y artículos para el hogar' },
  { name: 'Papeleria', description: 'Artículos de papelería y librería' },
];

export const seedAdmin = async (userRepository: IUserRepository = new UserRepository()): Promise<void> => {
  if (await userRepository.existsByRole(UserRole.ADMIN)) return;

  const admin = new User({
    firstName: 'Admin',
    lastName: 'Sistema',
    dni: env.initialAdmin.dni,
    email: env.initialAdmin.email,
    password: env.initialAdmin.password,
    role: UserRole.ADMIN,
  });
  await userRepository.save(admin);
  logger.info('Usuario ADMIN inicial creado');
};

export const seedCategories = async (
  categoryRepository: ICategoryRepository = new CategoryRepository(),
): Promise<void> => {
  if ((await categoryRepository.count()) > 0) return;

  for (const item of INITIAL_CATEGORIES) {
    const category = new Category(item);
    await categoryRepository.save(category);
  }
  logger.info('Categorías iniciales creadas');
};

export const runSeeder = async (
  userRepository: IUserRepository = new UserRepository(),
  categoryRepository: ICategoryRepository = new CategoryRepository(),
): Promise<void> => {
  await seedAdmin(userRepository);
  await seedCategories(categoryRepository);
};
