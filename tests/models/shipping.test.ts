import { Shipping } from '../../src/models/shipping';

describe('Shipping Model', () => {
  it('Debería crear un envío válido y recortar strings con trim', () => {
    const shipping = new Shipping({
      address: '  Av. Siempre Viva 742  ',
      provinceId: '  prov-1  ',
      provinceName: '  Buenos Aires  ',
      cost: 500,
      trackingCode: '  TRK-1234  ',
    });

    expect(shipping.getAddress()).toBe('Av. Siempre Viva 742');
    expect(shipping.getProvinceId()).toBe('prov-1');
    expect(shipping.getProvinceName()).toBe('Buenos Aires');
    expect(shipping.getCost()).toBe(500);
    expect(shipping.getTrackingCode()).toBe('TRK-1234');
  });

  it('Debería permitir actualizar el trackingCode con setTrackingCode', () => {
    const shipping = new Shipping({ cost: 500 });
    expect(shipping.getTrackingCode()).toBeUndefined();

    shipping.setTrackingCode('  TRK-9999  ');
    expect(shipping.getTrackingCode()).toBe('TRK-9999');
  });
});
