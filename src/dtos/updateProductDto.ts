export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  salePrice?: number;
  stock?: number;
  categoryId?: string;
}
