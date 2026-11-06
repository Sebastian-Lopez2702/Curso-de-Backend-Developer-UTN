import { Invoice } from '../../src/models/invoice';

describe('Invoice Model', () => {
  it('Debería crear una factura con valores por defecto (tipo B y fecha actual)', () => {
    const before = new Date();
    const invoice = new Invoice({
      subtotal: 1000,
      tax: 210,
      shippingCost: 500,
      total: 1710,
    });
    const after = new Date();

    expect(invoice.getInvoiceType()).toBe('B');
    expect(invoice.getSubtotal()).toBe(1000);
    expect(invoice.getTax()).toBe(210);
    expect(invoice.getShippingCost()).toBe(500);
    expect(invoice.getTotal()).toBe(1710);
    expect(invoice.getDate().getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(invoice.getDate().getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('Debería permitir especificar tipo de factura y fecha personalizada', () => {
    const customDate = new Date('2026-01-01T10:00:00Z');
    const invoice = new Invoice({
      invoiceType: 'A',
      subtotal: 2000,
      tax: 420,
      shippingCost: 0,
      total: 2420,
      date: customDate,
    });

    expect(invoice.getInvoiceType()).toBe('A');
    expect(invoice.getDate()).toEqual(customDate);
  });
});
