import bcrypt from 'bcrypt';
import { ValidationError } from '../../src/errors/DomainErrors';
import { User, UserRole } from '../../src/models/user';
import { buildUserProps } from '../helpers/factories';

const captureValidationError = (props: object): ValidationError => {
  try {
    new User(props);
  } catch (error) {
    return error as ValidationError;
  }
  throw new Error('Se esperaba un ValidationError');
};

describe('User', () => {
  describe('creación', () => {
    it('Debería crear un usuario con rol CLIENT por defecto', () => {
      const user = new User(buildUserProps());
      expect(user.getRole()).toBe(UserRole.CLIENT);
      expect(user.isAdmin()).toBe(false);
      expect(user.getId()).toBeUndefined();
    });

    it('Debería normalizar el email a minúsculas y sin espacios', () => {
      const user = new User(buildUserProps({ email: '  ANA@Example.COM ' }));
      expect(user.getEmail()).toBe('ana@example.com');
    });

    it('Debería aceptar el rol SELLER y ADMIN', () => {
      expect(new User(buildUserProps({ role: UserRole.SELLER })).getRole()).toBe(UserRole.SELLER);
      expect(new User(buildUserProps({ role: UserRole.ADMIN })).isAdmin()).toBe(true);
    });

    it('Debería permitir asignar el id', () => {
      const user = new User(buildUserProps());
      user.assignId('abc123');
      expect(user.getId()).toBe('abc123');
    });
  });

  describe('validaciones', () => {
    it('Debería informar todos los campos obligatorios faltantes', () => {
      const error = captureValidationError({});
      expect(Object.keys(error.details)).toEqual(
        expect.arrayContaining(['firstName', 'lastName', 'dni', 'email', 'password']),
      );
    });

    it('Debería rechazar un email con formato inválido', () => {
      const error = captureValidationError(buildUserProps({ email: 'no-es-un-email' }));
      expect(error.details).toHaveProperty('email');
    });

    it('Debería rechazar una contraseña de menos de 6 caracteres', () => {
      const error = captureValidationError(buildUserProps({ password: '123' }));
      expect(error.details).toHaveProperty('password');
    });

    it('Debería rechazar un rol inexistente', () => {
      const error = captureValidationError(buildUserProps({ role: 'ROOT' }));
      expect(error.details).toHaveProperty('role');
    });

    it('Debería rechazar valores que no son texto', () => {
      const error = captureValidationError(buildUserProps({ email: { $gt: '' } as unknown as string }));
      expect(error.details).toHaveProperty('email');
    });
  });

  describe('verificar contraseña', () => {
    it('Debería devolver true con la contraseña correcta', async () => {
      const user = new User(buildUserProps());
      user.assignPasswordHash(await bcrypt.hash('correcta1', 4));
      expect(await user.verifyPassword('correcta1')).toBe(true);
    });

    it('Debería devolver false con una contraseña incorrecta', async () => {
      const user = new User(buildUserProps());
      user.assignPasswordHash(await bcrypt.hash('correcta1', 4));
      expect(await user.verifyPassword('incorrecta')).toBe(false);
    });
  });
});
