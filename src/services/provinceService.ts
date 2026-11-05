import { ResourceNotFoundError } from '../errors/DomainErrors';
import { UpdateProvinceDto } from '../dtos/updateProvinceDto';
import { IProvinceRepository } from '../interfaces/provinceRepository';
import { Province } from '../models/province';

export class ProvinceService {
  constructor(private readonly provinceRepository: IProvinceRepository) {}

  public async getAll(): Promise<Province[]> {
    return this.provinceRepository.findAll();
  }

  public async updateShippingCost(id: string, dto: UpdateProvinceDto): Promise<Province> {
    const province = await this.provinceRepository.findById(id);
    if (!province) {
      throw new ResourceNotFoundError('Provincia no encontrada');
    }

    province.updateShippingCost(dto.shippingCost);
    await this.provinceRepository.save(province);
    return province;
  }
}
