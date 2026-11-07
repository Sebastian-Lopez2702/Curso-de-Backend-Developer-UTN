import { ErrorDetail } from '../../errors/DomainErrors';

export const InvoiceErrorMessages = {
  INVOICE_TYPE_INVALID: (): ErrorDetail => ({
    field: 'invoiceType',
    message: 'El tipo de factura debe ser un texto no vacío',
  }),
  SUBTOTAL_INVALID: (): ErrorDetail => ({
    field: 'subtotal',
    message: 'El subtotal debe ser un número mayor o igual a 0',
  }),
  TAX_INVALID: (): ErrorDetail => ({
    field: 'tax',
    message: 'El impuesto debe ser un número mayor o igual a 0',
  }),
  SHIPPING_COST_INVALID: (): ErrorDetail => ({
    field: 'shippingCost',
    message: 'El costo de envío debe ser un número mayor o igual a 0',
  }),
  TOTAL_INVALID: (): ErrorDetail => ({
    field: 'total',
    message: 'El total debe ser un número mayor o igual a 0',
  }),
  DATE_INVALID: (): ErrorDetail => ({
    field: 'date',
    message: 'La fecha de la factura no es válida',
  }),
};
