import { ErrorDetail } from '../../errors/DomainErrors';

export const ShippingErrorMessages = {
  COST_INVALID: (): ErrorDetail => ({
    field: 'cost',
    message: 'El costo de envío debe ser un número mayor o igual a 0',
  }),
  ADDRESS_INVALID: (): ErrorDetail => ({
    field: 'address',
    message: 'La dirección debe ser un texto no vacío',
  }),
  PROVINCE_ID_INVALID: (): ErrorDetail => ({
    field: 'provinceId',
    message: 'El identificador de provincia debe ser un texto no vacío',
  }),
  PROVINCE_NAME_INVALID: (): ErrorDetail => ({
    field: 'provinceName',
    message: 'El nombre de provincia debe ser un texto no vacío',
  }),
  TRACKING_CODE_INVALID: (): ErrorDetail => ({
    field: 'trackingCode',
    message: 'El código de seguimiento debe ser un texto no vacío',
  }),
};
