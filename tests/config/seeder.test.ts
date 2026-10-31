import { env } from "../../src/config/env";
import { seedAdmin } from "../../src/config/seeder";
import { UserRole } from "../../src/models/user";
import { UserRepository } from "../../src/repositories/userRepository";
import { clearUsers, connectTestDb, disconnectTestDb } from "../helpers/db";
import { createUser } from "../helpers/factories";

describe("Seeder - Admin inicial", () => {
  const repository = new UserRepository();

  beforeAll(connectTestDb);
  beforeEach(clearUsers);
  afterAll(async () => {
    await clearUsers();
    await disconnectTestDb();
  });

  it("Debería crear el ADMIN con los datos del entorno si no existe ninguno", async () => {
    await seedAdmin(repository);
    const admin = await repository.findByEmail(env.initialAdmin.email);
    expect(admin?.isAdmin()).toBe(true);
    expect(await admin?.verifyPassword(env.initialAdmin.password)).toBe(true);
  });

  it("Debería ser idempotente: no crea un segundo ADMIN", async () => {
    await seedAdmin(repository);
    await seedAdmin(repository);
    expect(await repository.findAll()).toHaveLength(1);
  });

  it("No debería crear un ADMIN si ya existe uno", async () => {
    await createUser({ role: UserRole.ADMIN });
    await seedAdmin(repository);
    expect(await repository.findAll()).toHaveLength(1);
  });
});
