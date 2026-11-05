import { env } from './env';
import { logger } from './logger';
import { ICategoryRepository } from '../interfaces/categoryRepository';
import { IProvinceRepository } from '../interfaces/provinceRepository';
import { IUserRepository } from '../interfaces/userRepository';
import { Category, CategoryProps } from '../models/category';
import { Province } from '../models/province';
import { User, UserRole } from '../models/user';
import { CategoryRepository } from '../repositories/categoryRepository';
import { ProvinceRepository } from '../repositories/provinceRepository';
import { UserRepository } from '../repositories/userRepository';

export const INITIAL_PROVINCES: { name: string; shippingCost: number }[] = [
  { name: 'Ciudad Autónoma de Buenos Aires', shippingCost: 3000 },
  { name: 'Buenos Aires', shippingCost: 3500 },

  { name: 'Entre Ríos', shippingCost: 4000 },
  { name: 'Santa Fe', shippingCost: 4000 },
  { name: 'Córdoba', shippingCost: 4500 },
  { name: 'La Pampa', shippingCost: 4800 },

  { name: 'San Luis', shippingCost: 5200 },
  { name: 'Corrientes', shippingCost: 5500 },
  { name: 'Mendoza', shippingCost: 5800 },
  { name: 'San Juan', shippingCost: 5800 },
  { name: 'Chaco', shippingCost: 6000 },
  { name: 'Santiago del Estero', shippingCost: 6000 },
  { name: 'Misiones', shippingCost: 6300 },
  { name: 'La Rioja', shippingCost: 6300 },
  { name: 'Catamarca', shippingCost: 6500 },
  { name: 'Tucumán', shippingCost: 6500 },
  { name: 'Formosa', shippingCost: 6800 },

  { name: 'Salta', shippingCost: 7200 },
  { name: 'Jujuy', shippingCost: 7500 },
  { name: 'Neuquén', shippingCost: 7200 },
  { name: 'Río Negro', shippingCost: 7200 },

  { name: 'Chubut', shippingCost: 8200 },
  { name: 'Santa Cruz', shippingCost: 9000 },
  { name: 'Tierra del Fuego', shippingCost: 10500 },
];

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

export const seedProvinces = async (
  provinceRepository: IProvinceRepository = new ProvinceRepository(),
): Promise<void> => {
  if ((await provinceRepository.count()) > 0) return;

  for (const item of INITIAL_PROVINCES) {
    const province = new Province(item.name, item.shippingCost);
    await provinceRepository.save(province);
  }
  logger.info('Provincias iniciales creadas');
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
  provinceRepository: IProvinceRepository = new ProvinceRepository(),
): Promise<void> => {
  await seedAdmin(userRepository);
  await seedProvinces(provinceRepository);
  await seedCategories(categoryRepository);
};
