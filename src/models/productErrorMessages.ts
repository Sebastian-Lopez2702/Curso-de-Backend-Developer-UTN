import { ErrorDetail } from "../errors/DomainErrors";

export const ProductErrorMessages = {
  SKU_REQUIRED: (): ErrorDetail => ({
    field: "sku",
    message: "El SKU del producto es obligatorio",
  }),
  NAME_REQUIRED: (): ErrorDetail => ({
    field: "name",
    message: "El nombre del producto es obligatorio",
  }),
  DESCRIPTION_REQUIRED: (): ErrorDetail => ({
    field: "description",
    message: "La descripción del producto es obligatoria",
  }),
  SALE_PRICE_INVALID: (min: number): ErrorDetail => ({
    field: "salePrice",
    message: `El precio de venta debe ser un número mayor o igual a ${min}`,
  }),
  STOCK_INVALID: (): ErrorDetail => ({
    field: "stock",
    message: "El stock debe ser un número entero mayor o igual a 0",
  }),
  CATEGORY_REQUIRED: (): ErrorDetail => ({
    field: "categoryId",
    message: "La categoría del producto es obligatoria",
  }),
  CATEGORY_NOT_FOUND: (): ErrorDetail => ({
    field: "categoryId",
    message: "La categoría indicada no existe",
  }),
  SELLER_REQUIRED: (): ErrorDetail => ({
    field: "sellerId",
    message: "El vendedor del producto es obligatorio",
  }),
  QUANTITY_INVALID: (): ErrorDetail => ({
    field: "quantity",
    message: "La cantidad debe ser un número entero mayor a 0",
  }),
  DUPLICATED: (field: string): ErrorDetail => ({
    field,
    message: `Ya existe un producto con ese valor de ${field}`,
  }),
};
