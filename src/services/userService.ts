import { RegisterUserDto } from "../dtos/registerUserDto";
import { LoginDto } from "../dtos/loginDto";
import { AuthenticationError, NotAllowedError, ResourceNotFoundError, ValidationError } from "../errors/DomainErrors";
import { IUserRepository } from "../interfaces/userRepository";
import { User } from "../models/user";
import { signToken } from "../utils/jwt";

const NOT_ALLOWED_ROL = "ADMIN";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  public async register(dto: RegisterUserDto): Promise<User> {
    if (dto.role === NOT_ALLOWED_ROL) {
      throw new NotAllowedError("No está permitido registrarse con el rol ADMIN");
    }

    const user = new User(dto);
    await this.userRepository.save(user);
    return user;
  }

  public async login(dto: LoginDto): Promise<{ token: string; user: User }> {
    const { email, password } = dto;

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new ValidationError([{ field: "credentials", message: "Email y contraseña son obligatorios" }]);
    }

    const user = await this.userRepository.findByEmail(email);
    const isValid = user ? await user.verifyPassword(password) : false;

    if (!user || !isValid) {
      throw new AuthenticationError("Credenciales inválidas");
    }

    const token = signToken({ userId: user.getId() as string, role: user.getRole() });
    return { token, user };
  }

  public async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError("Usuario no encontrado");
    }
    return user;
  }

  public async getAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
