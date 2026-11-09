import { OrderStatus } from '../models/order';

export interface UpdateShippingDto {
  orderStatus?: OrderStatus;
}
