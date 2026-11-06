import { ErrorDetail } from '../../errors/DomainErrors';

export const CategoryErrorMessages = {
  NAME_REQUIRED: (): ErrorDetail => ({
    field: 'name',
    message: 'El nombre de la categoría es obligatorio',
  }),
  DESCRIPTION_INVALID: (): ErrorDetail => ({
    field: 'description',
    message: 'La descripción de la categoría debe ser un texto',
  }),
  DUPLICATED: (field: string): ErrorDetail => ({
    field,
    message: `Ya existe una categoría con ese valor de ${field}`,
  }),
};
