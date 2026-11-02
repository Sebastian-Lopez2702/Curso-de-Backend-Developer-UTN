import { Province } from '../models/province';

export interface IProvinceRepository {
  save(province: Province): Promise<void>;
  findById(id: string): Promise<Province | null>;
  findAll(): Promise<Province[]>;
  count(): Promise<number>;
}
