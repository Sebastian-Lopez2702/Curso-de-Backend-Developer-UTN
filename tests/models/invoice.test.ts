import { ValidationError } from '../../src/errors/DomainErrors';
import { Invoice, InvoiceProps } from '../../src/models/invoice';

const validProps = (overrides: Partial<InvoiceProps> = {}): InvoiceProps => ({
  subtotal: 1000,
  tax: 210,
  shippingCost: 500,
  total: 1710,
  ...overrides,
});

describe('Invoice Model', () => {
  describe('Creación exitosa', () => {
    it('Debería crear una factura con valores por defecto (tipo B y fecha actual)', () => {
      const before = new Date();
      const invoice = new Invoice(validProps());
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
      const invoice = new Invoice(
        validProps({
          invoiceType: '  A  ',
          subtotal: 2000,
          tax: 420,
          shippingCost: 0,
          total: 2420,
          date: customDate,
        }),
      );

      expect(invoice.getInvoiceType()).toBe('A');
      expect(invoice.getDate()).toEqual(customDate);
    });

    it('Debería permitir montos en 0 (ej. envío gratis)', () => {
      const invoice = new Invoice(
        validProps({
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          total: 0,
        }),
      );

      expect(invoice.getSubtotal()).toBe(0);
      expect(invoice.getTax()).toBe(0);
      expect(invoice.getShippingCost()).toBe(0);
      expect(invoice.getTotal()).toBe(0);
    });
  });

  describe('validaciones', () => {
    it('Debería rechazar subtotal faltante, no numérico, NaN, infinito o negativo', () => {
      expect(() => new Invoice(validProps({ subtotal: undefined }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ subtotal: '1000' as unknown as number }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ subtotal: Number.NaN }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ subtotal: Number.POSITIVE_INFINITY }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ subtotal: -1 }))).toThrow(ValidationError);
    });

    it('Debería rechazar tax faltante, no numérico, NaN, infinito o negativo', () => {
      expect(() => new Invoice(validProps({ tax: undefined }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ tax: '210' as unknown as number }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ tax: Number.NaN }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ tax: Number.POSITIVE_INFINITY }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ tax: -0.01 }))).toThrow(ValidationError);
    });

    it('Debería rechazar shippingCost faltante, no numérico, NaN, infinito o negativo', () => {
      expect(() => new Invoice(validProps({ shippingCost: undefined }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ shippingCost: '500' as unknown as number }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ shippingCost: Number.NaN }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ shippingCost: Number.POSITIVE_INFINITY }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ shippingCost: -10 }))).toThrow(ValidationError);
    });

    it('Debería rechazar total faltante, no numérico, NaN, infinito o negativo', () => {
      expect(() => new Invoice(validProps({ total: undefined }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ total: '1710' as unknown as number }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ total: Number.NaN }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ total: Number.POSITIVE_INFINITY }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ total: -5 }))).toThrow(ValidationError);
    });

    it('Debería rechazar invoiceType si se envía vacío o solo espacios', () => {
      expect(() => new Invoice(validProps({ invoiceType: '' }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ invoiceType: '   ' }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ invoiceType: 123 as unknown as string }))).toThrow(ValidationError);
    });

    it('Debería rechazar date inválida', () => {
      expect(() => new Invoice(validProps({ date: new Date('fecha-invalida') }))).toThrow(ValidationError);
      expect(() => new Invoice(validProps({ date: '2026-01-01' as unknown as Date }))).toThrow(ValidationError);
    });

    it('Debería acumular múltiples errores si varios campos son inválidos', () => {
      try {
        new Invoice({
          subtotal: -10,
          tax: -5,
          shippingCost: -2,
          total: -17,
        });
        fail('Se esperaba que lanzara ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const valError = error as ValidationError;
        expect(valError.details).toHaveProperty('subtotal');
        expect(valError.details).toHaveProperty('tax');
        expect(valError.details).toHaveProperty('shippingCost');
        expect(valError.details).toHaveProperty('total');
      }
    });
  });
});
