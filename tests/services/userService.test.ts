import bcrypt from 'bcrypt';
import {
  AuthenticationError,
  NotAllowedError,
  ResourceNotFoundError,
  ValidationError,
} from '../../src/errors/DomainErrors';
import { IUserRepository } from '../../src/interfaces/userRepository';
import { User, UserRole } from '../../src/models/user';
import { UserService } from '../../src/services/userService';
import { decodeToken } from '../../src/utils/jwt';
import { buildUserProps } from '../helpers/factories';

const buildRepositoryMock = (): jest.Mocked<IUserRepository> => ({
  save: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  existsByRole: jest.fn(),
});

const buildStoredUser = async (password: string, role: UserRole = UserRole.CLIENT): Promise<User> => {
  const user = new User(buildUserProps({ role }));
  user.assignId('abc123');
  user.assignPasswordHash(await bcrypt.hash(password, 4));
  return user;
};

describe('UserService', () => {
  let repository: jest.Mocked<IUserRepository>;
  let service: UserService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    service = new UserService(repository);
  });

  describe('register', () => {
    it('Debería traducir el error de clave duplicada a ValidationError', async () => {
      repository.save.mockRejectedValue({ code: 11000, keyPattern: { email: 1 } });
      const error = await service.register(buildUserProps()).catch((e) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveProperty('email');
    });

    it('Debería relanzar los errores que no son de clave duplicada', async () => {
      const failure = new Error('db caída');
      repository.save.mockRejectedValue(failure);
      await expect(service.register(buildUserProps())).rejects.toBe(failure);
    });
    it('Debería guardar el usuario con rol CLIENT por defecto', async () => {
      const user = await service.register(buildUserProps());
      expect(user.getRole()).toBe(UserRole.CLIENT);
      expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('Debería permitir registrar un SELLER', async () => {
      const user = await service.register(buildUserProps({ role: UserRole.SELLER }));
      expect(user.getRole()).toBe(UserRole.SELLER);
    });

    it('Debería lanzar NotAllowedError si se intenta registrar un ADMIN', async () => {
      await expect(service.register(buildUserProps({ role: UserRole.ADMIN }))).rejects.toBeInstanceOf(NotAllowedError);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('Debería lanzar ValidationError con datos inválidos sin tocar el repositorio', async () => {
      await expect(service.register({ email: 'x' })).rejects.toBeInstanceOf(ValidationError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('Debería devolver un token con userId y role', async () => {
      repository.findByEmail.mockResolvedValue(await buildStoredUser('correcta1', UserRole.SELLER));

      const { token, user } = await service.login({ email: 'a@a.com', password: 'correcta1' });

      expect(decodeToken(token)).toEqual({ userId: 'abc123', role: UserRole.SELLER });
      expect(user.getId()).toBe('abc123');
    });

    it('Debería lanzar AuthenticationError si el usuario no existe', async () => {
      repository.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: '123456' })).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('Debería lanzar AuthenticationError si la contraseña es incorrecta', async () => {
      repository.findByEmail.mockResolvedValue(await buildStoredUser('correcta1'));
      await expect(service.login({ email: 'a@a.com', password: 'incorrecta' })).rejects.toBeInstanceOf(
        AuthenticationError,
      );
    });

    it('Debería lanzar ValidationError si faltan credenciales o no son texto', async () => {
      await expect(service.login({})).rejects.toBeInstanceOf(ValidationError);
      await expect(service.login({ email: { $gt: '' } as any, password: 'x' })).rejects.toBeInstanceOf(ValidationError);
      expect(repository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('Debería devolver el usuario si existe', async () => {
      const stored = await buildStoredUser('correcta1');
      repository.findById.mockResolvedValue(stored);
      expect(await service.getProfile('abc123')).toBe(stored);
    });

    it('Debería lanzar ResourceNotFoundError si no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getProfile('abc123')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('getAll', () => {
    it('Debería devolver los usuarios del repositorio', async () => {
      const users = [await buildStoredUser('correcta1')];
      repository.findAll.mockResolvedValue(users);
      expect(await service.getAll()).toBe(users);
    });
  });
});
