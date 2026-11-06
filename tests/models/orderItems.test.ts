import { ValidationError } from '../../src/errors/DomainErrors';
import { OrderItem } from '../../src/models/orderItems';

describe('OrderItem Model', () => {
  it('Debería crear un item válido', () => {
    const item = new OrderItem({
      productId: 'prod-1',
      quantity: 2,
      recordedSalePrice: 1500,
      sellerId: 'seller-1',
    });
    expect(item.getProductId()).toBe('prod-1');
    expect(item.getQuantity()).toBe(2);
    expect(item.getRecordedSalePrice()).toBe(1500);
    expect(item.getSellerId()).toBe('seller-1');
  });

  it('Debería rechazar productId vacío', () => {
    expect(() => new OrderItem({ productId: '', quantity: 1 })).toThrow(ValidationError);
    expect(() => new OrderItem({ productId: '   ', quantity: 1 })).toThrow(ValidationError);
  });

  it('Debería rechazar quantity menor o igual a cero o no entera', () => {
    expect(() => new OrderItem({ productId: 'prod-1', quantity: 0 })).toThrow(ValidationError);
    expect(() => new OrderItem({ productId: 'prod-1', quantity: -2 })).toThrow(ValidationError);
    expect(() => new OrderItem({ productId: 'prod-1', quantity: 1.5 })).toThrow(ValidationError);
  });

  it('Debería rechazar recordedSalePrice negativo', () => {
    expect(
      () =>
        new OrderItem({
          productId: 'prod-1',
          quantity: 1,
          recordedSalePrice: -10,
        }),
    ).toThrow(ValidationError);
  });

  it('Debería actualizar cantidad con setQuantity y validar', () => {
    const item = new OrderItem({ productId: 'prod-1', quantity: 1 });
    item.setQuantity(5);
    expect(item.getQuantity()).toBe(5);
    expect(() => item.setQuantity(0)).toThrow(ValidationError);
  });

  it('Debería actualizar precio con setRecordedSalePrice y validar', () => {
    const item = new OrderItem({ productId: 'prod-1', quantity: 1 });
    item.setRecordedSalePrice(2000);
    expect(item.getRecordedSalePrice()).toBe(2000);
    expect(() => item.setRecordedSalePrice(-1)).toThrow(ValidationError);
  });

  it('Debería asignar sellerId con assignSellerId', () => {
    const item = new OrderItem({ productId: 'prod-1', quantity: 1 });
    expect(item.getSellerId()).toBeUndefined();
    item.assignSellerId('seller-123');
    expect(item.getSellerId()).toBe('seller-123');
  });
});
