import { RegisterUserDto } from '../dtos/registerUserDto';
import { LoginDto } from '../dtos/loginDto';
import { AuthenticationError, NotAllowedError, ResourceNotFoundError, ValidationError } from '../errors/DomainErrors';
import { IUserRepository } from '../interfaces/userRepository';
import { User, UserRole } from '../models/user';
import { UserErrorMessages } from '../models/error-menssages/userErrorMessages';
import { getDuplicatedField, isDuplicateKeyError } from '../utils/duplicateKey';
import { signToken } from '../utils/jwt';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) { }

  public async register(dto: RegisterUserDto): Promise<User> {
    if (dto.role === UserRole.ADMIN) {
      throw new NotAllowedError('No está permitido registrarse con el rol ADMIN');
    }

    const user = new User(dto);
    try {
      await this.userRepository.save(user);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const field = getDuplicatedField(err);
        throw new ValidationError([UserErrorMessages.DUPLICATED(field)]);
      }
      throw err;
    }
    return user;
  }

  public async login(dto: LoginDto): Promise<{ token: string; user: User }> {
    const { email, password } = dto;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new ValidationError([{ field: 'credentials', message: 'Email y contraseña son obligatorios' }]);
    }

    const user = await this.userRepository.findByEmail(email);
    const isValid = user ? await user.verifyPassword(password) : false;

    if (!user || !isValid) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const token = signToken({ userId: user.getId() as string, role: user.getRole() });
    return { token, user };
  }

  public async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Usuario no encontrado');
    }
    return user;
  }

  public async getAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
