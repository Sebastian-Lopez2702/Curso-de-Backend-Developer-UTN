import { JwtPayload } from '../../src/interfaces/auth';
import { Category, CategoryProps } from '../../src/models/category';
import { Product, ProductProps } from '../../src/models/product';
import { Province } from '../../src/models/province';
import { User, UserProps } from '../../src/models/user';
import { CategoryRepository } from '../../src/repositories/categoryRepository';
import { ProductRepository } from '../../src/repositories/productRepository';
import { ProvinceRepository } from '../../src/repositories/provinceRepository';
import { UserRepository } from '../../src/repositories/userRepository';
import { signToken } from '../../src/utils/jwt';

export const DEFAULT_PASSWORD = 'secreto123';

let counter = 0;

export const buildUserProps = (overrides: UserProps = {}): UserProps => {
  counter += 1;
  return {
    firstName: 'Ana',
    lastName: 'Pérez',
    dni: `3000${counter}`,
    email: `ana${counter}@example.com`,
    password: DEFAULT_PASSWORD,
    ...overrides,
  };
};

export const createUser = async (overrides: UserProps = {}): Promise<User> => {
  const user = new User(buildUserProps(overrides));
  await new UserRepository().save(user);
  return user;
};

export const createCategory = async (overrides: CategoryProps = {}): Promise<Category> => {
  counter += 1;
  const category = new Category({
    name: `Categoría ${counter}`,
    description: 'Descripción',
    ...overrides,
  });
  await new CategoryRepository().save(category);
  return category;
};

export const createProvince = async (name?: string, shippingCost = 1000): Promise<Province> => {
  counter += 1;
  const province = new Province(name ?? `Provincia ${counter}`, shippingCost);
  await new ProvinceRepository().save(province);
  return province;
};

/** Si no se indican categoryId / sellerId, crea una categoría y un vendedor nuevos. */
export const createProduct = async (overrides: ProductProps = {}): Promise<Product> => {
  counter += 1;
  const categoryId = overrides.categoryId ?? ((await createCategory()).getId() as string);
  const sellerId = overrides.sellerId ?? ((await createUser({ role: 'SELLER' })).getId() as string);
  const product = new Product({
    sku: `SKU-${counter}`,
    name: `Producto ${counter}`,
    description: 'Descripción del producto',
    salePrice: 1000,
    stock: 10,
    ...overrides,
    categoryId,
    sellerId,
  });
  await new ProductRepository().save(product);
  return product;
};

export const tokenFor = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.getId() as string,
    role: user.getRole(),
  };
  return signToken(payload);
};
