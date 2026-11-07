import { ValidationError } from '../../src/errors/DomainErrors';
import { Shipping } from '../../src/models/shipping';

describe('Shipping Model', () => {
  describe('Creación exitosa', () => {
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

    it('Debería permitir crear un envío solo con cost en 0 (ej. envío gratis)', () => {
      const shipping = new Shipping({ cost: 0 });

      expect(shipping.getCost()).toBe(0);
      expect(shipping.getAddress()).toBeUndefined();
      expect(shipping.getProvinceId()).toBeUndefined();
      expect(shipping.getProvinceName()).toBeUndefined();
      expect(shipping.getTrackingCode()).toBeUndefined();
    });

    it('Debería permitir actualizar el trackingCode con setTrackingCode', () => {
      const shipping = new Shipping({ cost: 500 });
      expect(shipping.getTrackingCode()).toBeUndefined();

      shipping.setTrackingCode('  TRK-9999  ');
      expect(shipping.getTrackingCode()).toBe('TRK-9999');
    });
  });

  describe('Validaciones de dominio', () => {
    it('Debería rechazar cost faltante, no numérico, NaN, infinito o negativo', () => {
      expect(() => new Shipping({ cost: undefined })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: '500' as unknown as number })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: Number.NaN })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: Number.POSITIVE_INFINITY })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: -1 })).toThrow(ValidationError);
    });

    it('Debería rechazar address si se envía no string o vacío', () => {
      expect(() => new Shipping({ cost: 100, address: '' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, address: '   ' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, address: 123 as unknown as string })).toThrow(ValidationError);
    });

    it('Debería rechazar provinceId si se envía no string o vacío', () => {
      expect(() => new Shipping({ cost: 100, provinceId: '' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, provinceId: '   ' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, provinceId: 123 as unknown as string })).toThrow(ValidationError);
    });

    it('Debería rechazar provinceName si se envía no string o vacío', () => {
      expect(() => new Shipping({ cost: 100, provinceName: '' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, provinceName: '   ' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, provinceName: 123 as unknown as string })).toThrow(ValidationError);
    });

    it('Debería rechazar trackingCode si se envía no string o vacío en el constructor', () => {
      expect(() => new Shipping({ cost: 100, trackingCode: '' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, trackingCode: '   ' })).toThrow(ValidationError);
      expect(() => new Shipping({ cost: 100, trackingCode: 123 as unknown as string })).toThrow(ValidationError);
    });

    it('Debería rechazar trackingCode no string o vacío en setTrackingCode', () => {
      const shipping = new Shipping({ cost: 100 });
      expect(() => shipping.setTrackingCode('')).toThrow(ValidationError);
      expect(() => shipping.setTrackingCode('   ')).toThrow(ValidationError);
      expect(() => shipping.setTrackingCode(123 as unknown as string)).toThrow(ValidationError);
    });

    it('Debería acumular múltiples errores si varios campos son inválidos', () => {
      try {
        new Shipping({
          cost: -50,
          address: '',
          provinceId: '   ',
          provinceName: '',
          trackingCode: '',
        });
        fail('Se esperaba que lanzara ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const valError = error as ValidationError;
        expect(valError.details).toHaveProperty('cost');
        expect(valError.details).toHaveProperty('address');
        expect(valError.details).toHaveProperty('provinceId');
        expect(valError.details).toHaveProperty('provinceName');
        expect(valError.details).toHaveProperty('trackingCode');
      }
    });
  });
});
