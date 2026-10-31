import { ValidationError } from '../../src/errors/DomainErrors';
import { User, UserRole } from '../../src/models/user';
import { UserRepository } from '../../src/repositories/userRepository';
import { UserModel } from '../../src/repositories/schemas/userSchema';
import { clearUsers, connectTestDb, disconnectTestDb } from '../helpers/db';
import { buildUserProps, createUser } from '../helpers/factories';

describe('UserRepository', () => {
  const repository = new UserRepository();

  beforeAll(connectTestDb);
  beforeEach(clearUsers);
  afterAll(async () => {
    await clearUsers();
    await disconnectTestDb();
  });

  describe('save', () => {
    it('Debería guardar el usuario y asignarle el id', async () => {
      const user = new User(buildUserProps());
      await repository.save(user);
      expect(user.getId()).toBeDefined();
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it('Debería guardar la contraseña hasheada y actualizar la entidad con el hash', async () => {
      const user = new User(buildUserProps({ password: 'secreto123' }));
      await repository.save(user);

      const record = await UserModel.findById(user.getId());
      expect(record?.password).not.toBe('secreto123');
      expect(record?.password).toMatch(/^\$2[aby]\$/);
      expect(await user.verifyPassword('secreto123')).toBe(true);
    });

    it('Debería lanzar ValidationError si el email ya existe', async () => {
      const existing = await createUser();
      const duplicated = new User(buildUserProps({ email: existing.getEmail() }));

      await expect(repository.save(duplicated)).rejects.toBeInstanceOf(ValidationError);
      await expect(repository.save(duplicated)).rejects.toMatchObject({ details: { email: expect.any(String) } });
    });

    it('Debería lanzar ValidationError si el DNI ya existe', async () => {
      const existing = await createUser();
      const duplicated = new User(buildUserProps({ dni: existing.getDni() }));

      await expect(repository.save(duplicated)).rejects.toMatchObject({ details: { dni: expect.any(String) } });
    });
  });

  describe('findByEmail', () => {
    it('Debería devolver el usuario como entidad, capaz de verificar su contraseña', async () => {
      const created = await createUser({ email: 'busqueda@example.com', password: 'secreto123' });
      const found = await repository.findByEmail('busqueda@example.com');

      expect(found).toBeInstanceOf(User);
      expect(found?.getId()).toBe(created.getId());
      expect(await found?.verifyPassword('secreto123')).toBe(true);
    });

    it('Debería ignorar mayúsculas y espacios en el email', async () => {
      await createUser({ email: 'busqueda@example.com' });
      expect(await repository.findByEmail('  BUSQUEDA@example.com ')).not.toBeNull();
    });

    it('Debería devolver null si no existe', async () => {
      expect(await repository.findByEmail('nadie@example.com')).toBeNull();
    });
  });

  describe('findById', () => {
    it('Debería devolver el usuario con ese id', async () => {
      const created = await createUser();
      const found = await repository.findById(created.getId() as string);
      expect(found?.getEmail()).toBe(created.getEmail());
    });

    it('Debería devolver null si el id no existe', async () => {
      expect(await repository.findById('64b7f0f2a1b2c3d4e5f60718')).toBeNull();
    });

    it('Debería devolver null si el id tiene un formato inválido', async () => {
      expect(await repository.findById('no-es-un-id')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('Debería devolver todos los usuarios como entidades', async () => {
      await createUser();
      await createUser();
      const users = await repository.findAll();
      expect(users).toHaveLength(2);
      expect(users.every((user) => user instanceof User)).toBe(true);
    });

    it('Debería devolver una lista vacía si no hay usuarios', async () => {
      expect(await repository.findAll()).toEqual([]);
    });
  });

  describe('existsByRole', () => {
    it('Debería devolver true si hay un usuario con ese rol', async () => {
      await createUser({ role: UserRole.SELLER });
      expect(await repository.existsByRole(UserRole.SELLER)).toBe(true);
    });

    it('Debería devolver false si no hay usuarios con ese rol', async () => {
      await createUser({ role: UserRole.CLIENT });
      expect(await repository.existsByRole(UserRole.ADMIN)).toBe(false);
    });
  });
});
