import { isValidObjectId } from 'mongoose';
import { ValidationError } from '../errors/DomainErrors';
import { IProvinceRepository } from '../interfaces/provinceRepository';
import { Province } from '../models/province';
import { ProvinceErrorMessages } from '../models/provinceErrorMessages';
import { ProvinceModel, ProvinceRecord } from './schemas/provinceSchema';

interface MongoDuplicateError {
  code?: number;
  keyPattern?: Record<string, number>;
}

export class ProvinceRepository implements IProvinceRepository {
  public async save(province: Province): Promise<void> {
    const data = {
      name: province.getName(),
      shippingCost: province.getShippingCost(),
    };

    try {
      const id = province.getId();
      if (id === undefined) {
        const record = await ProvinceModel.create(data);
        province.assignId(record._id.toString());
      } else {
        await ProvinceModel.findByIdAndUpdate(id, data, { runValidators: true });
      }
    } catch (err) {
      throw this.translateError(err);
    }
  }

  public async findById(id: string): Promise<Province | null> {
    if (!isValidObjectId(id)) return null;
    const record = await ProvinceModel.findById(id);
    return record ? this.toEntity(record) : null;
  }

  public async findAll(): Promise<Province[]> {
    const records = await ProvinceModel.find().sort({ name: 1 });
    return records.map((record) => this.toEntity(record));
  }

  public async count(): Promise<number> {
    return ProvinceModel.countDocuments();
  }

  private toEntity(record: ProvinceRecord & { _id: { toString(): string } }): Province {
    const province = new Province(record.name, record.shippingCost);
    province.assignId(record._id.toString());
    return province;
  }

  private translateError(err: unknown): unknown {
    const mongoError = err as MongoDuplicateError;
    if (mongoError?.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0] ?? 'unknown';
      return new ValidationError([ProvinceErrorMessages.DUPLICATED(field)]);
    }
    return err;
  }
}
