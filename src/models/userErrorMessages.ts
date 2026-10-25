import { ErrorDetail } from "../errors/DomainErrors";

export const UserErrorMessages = {
  FIRST_NAME_REQUIRED: (): ErrorDetail => ({ field: "firstName", message: "El nombre es obligatorio" }),
  LAST_NAME_REQUIRED: (): ErrorDetail => ({ field: "lastName", message: "El apellido es obligatorio" }),
  DNI_REQUIRED: (): ErrorDetail => ({ field: "dni", message: "El DNI es obligatorio" }),
  EMAIL_REQUIRED: (): ErrorDetail => ({ field: "email", message: "El email es obligatorio" }),
  EMAIL_INVALID: (): ErrorDetail => ({ field: "email", message: "El email no tiene un formato válido" }),
  PASSWORD_REQUIRED: (): ErrorDetail => ({ field: "password", message: "La contraseña es obligatoria" }),
  PASSWORD_TOO_SHORT: (min: number): ErrorDetail => ({
    field: "password",
    message: `La contraseña debe tener al menos ${min} caracteres`,
  }),
  PHONE_INVALID: (): ErrorDetail => ({ field: "phone", message: "El teléfono debe ser un texto" }),
  ROLE_INVALID: (roles: readonly string[]): ErrorDetail => ({
    field: "role",
    message: `Rol inválido. Valores permitidos: ${roles.join(", ")}`,
  }),
  DUPLICATED: (field: string): ErrorDetail => ({
    field,
    message: `Ya existe un usuario con ese valor de ${field}`,
  }),
};
