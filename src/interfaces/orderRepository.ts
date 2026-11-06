import { Order } from '../models/order';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findCartByUserId(userId: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findBySellerId(sellerId: string): Promise<Order[]>;
  findAll(): Promise<Order[]>;
}
