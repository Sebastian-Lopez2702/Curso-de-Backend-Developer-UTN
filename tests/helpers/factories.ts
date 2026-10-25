import { JwtPayload } from "../../src/interfaces/auth";
import { User, UserProps } from "../../src/models/user";
import { UserRepository } from "../../src/repositories/userRepository";
import { signToken } from "../../src/utils/jwt";

export const DEFAULT_PASSWORD = "secreto123";

let counter = 0;

export const buildUserProps = (overrides: UserProps = {}): UserProps => {
  counter += 1;
  return {
    firstName: "Ana",
    lastName: "Pérez",
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

export const tokenFor = (user: User): string => {
  const payload: JwtPayload = { userId: user.getId() as string, role: user.getRole() };
  return signToken(payload);
};
