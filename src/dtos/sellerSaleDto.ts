import { OrderStatus } from '../models/order';

export interface SellerSaleItemDto {
  productId: string;
  sku: string;
  name: string;
  category: {
    id?: string;
    name: string;
  };
  quantity: number;
  recordedSalePrice: number;
}

export interface SellerSaleDto {
  orderId?: string;
  orderStatus: OrderStatus;
  saleDate?: Date;
  items: SellerSaleItemDto[];
  subtotal: number;
}

