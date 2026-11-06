import { ErrorDetail } from '../errors/DomainErrors';

export const OrderErrorMessages = {
  USER_REQUIRED: (): ErrorDetail => ({
    field: 'userId',
    message: 'El usuario de la orden es obligatorio',
  }),
  PRODUCT_REQUIRED: (): ErrorDetail => ({
    field: 'productId',
    message: 'El producto es obligatorio',
  }),
  QUANTITY_INVALID: (): ErrorDetail => ({
    field: 'quantity',
    message: 'La cantidad debe ser un número entero mayor a 0',
  }),
  PRODUCT_INACTIVE: (): ErrorDetail => ({
    field: 'productId',
    message: 'El producto no está activo',
  }),
  PRICE_INVALID: (): ErrorDetail => ({
    field: 'price',
    message: 'El precio debe ser un número mayor o igual a 0',
  }),
  ITEM_NOT_FOUND: (): ErrorDetail => ({
    field: 'productId',
    message: 'El producto no se encuentra en el carrito',
  }),
  CART_EMPTY: (): ErrorDetail => ({
    field: 'items',
    message: 'El carrito no contiene productos',
  }),
  INVALID_STATUS_TRANSITION: (current: string, next: string): ErrorDetail => ({
    field: 'orderStatus',
    message: `No se puede cambiar el estado de ${current} a ${next}`,
  }),
  INVALID_STATUS: (): ErrorDetail => ({
    field: 'orderStatus',
    message: 'El estado de la orden no es válido',
  }),
};
