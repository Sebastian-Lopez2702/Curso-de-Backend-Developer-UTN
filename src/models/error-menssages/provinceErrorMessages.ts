import { ErrorDetail } from '../../errors/DomainErrors';

export const ProvinceErrorMessages = {
  NAME_REQUIRED: (): ErrorDetail => ({ field: 'name', message: 'El nombre de la provincia es obligatorio' }),
  SHIPPING_COST_INVALID: (): ErrorDetail => ({
    field: 'shippingCost',
    message: 'El costo de envío debe ser un número mayor o igual a 0',
  }),
};
