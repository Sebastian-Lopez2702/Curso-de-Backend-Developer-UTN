import { ValidationError } from '../../src/errors/DomainErrors';
import { Invoice } from '../../src/models/invoice';
import { Order, OrderProps, OrderStatus } from '../../src/models/order';
import { Shipping } from '../../src/models/shipping';

const validProps = (overrides: OrderProps = {}): OrderProps => ({
  userId: 'user-1',
  ...overrides,
});

describe('Order Model', () => {
  describe('Creación y validación básica', () => {
    it('Debería crear una orden en estado CART por defecto con items vacíos', () => {
      const order = new Order(validProps());
      expect(order.getUserId()).toBe('user-1');
      expect(order.getOrderStatus()).toBe(OrderStatus.CART);
      expect(order.getItems()).toHaveLength(0);
      expect(order.getId()).toBeUndefined();
    });

    it('Debería rechazar userId vacío o ausente', () => {
      expect(() => new Order(validProps({ userId: '' }))).toThrow(ValidationError);
      expect(() => new Order(validProps({ userId: '   ' }))).toThrow(ValidationError);
      expect(() => new Order(validProps({ userId: undefined }))).toThrow(ValidationError);
    });

    it('Debería rechazar un estado no válido', () => {
      expect(() => new Order(validProps({ orderStatus: 'UNKNOWN_STATUS' as OrderStatus }))).toThrow(ValidationError);
    });
  });

  describe('Manejo de items en Order', () => {
    it('Debería agregar un nuevo producto al carrito', () => {
      const order = new Order(validProps());
      order.addItem({ productId: 'prod-1', quantity: 2, sellerId: 'seller-1' });

      expect(order.getItems()).toHaveLength(1);
      expect(order.getItems()[0].getProductId()).toBe('prod-1');
      expect(order.getItems()[0].getQuantity()).toBe(2);
    });

    it('Debería incrementar la cantidad si el producto ya existe en el carrito', () => {
      const order = new Order(validProps());
      order.addItem({ productId: 'prod-1', quantity: 2 });
      order.addItem({ productId: 'prod-1', quantity: 3 });

      expect(order.getItems()).toHaveLength(1);
      expect(order.getItems()[0].getQuantity()).toBe(5);
    });

    it('Debería agregar múltiples productos distintos', () => {
      const order = new Order(validProps());
      order.addItem({ productId: 'prod-1', quantity: 1 });
      order.addItem({ productId: 'prod-2', quantity: 4 });

      expect(order.getItems()).toHaveLength(2);
    });

    it('Debería actualizar la cantidad de un ítem existente', () => {
      const order = new Order(validProps());
      order.addItem({ productId: 'prod-1', quantity: 2 });
      order.updateItemQuantity('prod-1', 10);

      expect(order.getItems()[0].getQuantity()).toBe(10);
    });

    it('Debería lanzar error al intentar actualizar un ítem no presente', () => {
      const order = new Order(validProps());
      expect(() => order.updateItemQuantity('inexistente', 5)).toThrow(ValidationError);
    });

    it('Debería eliminar un ítem del carrito', () => {
      const order = new Order(validProps());
      order.addItem({ productId: 'prod-1', quantity: 2 });
      order.removeItem('prod-1');

      expect(order.getItems()).toHaveLength(0);
    });

    it('Debería lanzar error al intentar eliminar un ítem no presente', () => {
      const order = new Order(validProps());
      expect(() => order.removeItem('inexistente')).toThrow(ValidationError);
    });
  });

  describe('Máquina de estados de la orden', () => {
    it('Debería permitir transiciones válidas: CART -> PENDING_DISPATCH -> IN_TRANSIT -> DELIVERED', () => {
      const order = new Order(validProps());
      expect(order.canTransitionTo(OrderStatus.PENDING_DISPATCH)).toBe(true);
      order.changeStatus(OrderStatus.PENDING_DISPATCH);
      expect(order.getOrderStatus()).toBe(OrderStatus.PENDING_DISPATCH);

      expect(order.canTransitionTo(OrderStatus.IN_TRANSIT)).toBe(true);
      order.changeStatus(OrderStatus.IN_TRANSIT);
      expect(order.getOrderStatus()).toBe(OrderStatus.IN_TRANSIT);

      expect(order.canTransitionTo(OrderStatus.DELIVERED)).toBe(true);
      order.changeStatus(OrderStatus.DELIVERED);
      expect(order.getOrderStatus()).toBe(OrderStatus.DELIVERED);

      // DELIVERED es terminal
      expect(order.canTransitionTo(OrderStatus.CANCELLED)).toBe(false);
      expect(() => order.changeStatus(OrderStatus.CANCELLED)).toThrow(ValidationError);
    });

    it('Debería permitir cancelar desde PENDING_DISPATCH', () => {
      const order = new Order(validProps({ orderStatus: OrderStatus.PENDING_DISPATCH }));
      expect(order.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
      order.changeStatus(OrderStatus.CANCELLED);
      expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);

      // CANCELLED es terminal
      expect(order.canTransitionTo(OrderStatus.PENDING_DISPATCH)).toBe(false);
      expect(() => order.changeStatus(OrderStatus.PENDING_DISPATCH)).toThrow(ValidationError);
    });

    it('Debería permitir cancelar desde IN_TRANSIT', () => {
      const order = new Order(validProps({ orderStatus: OrderStatus.IN_TRANSIT }));
      expect(order.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
      order.changeStatus(OrderStatus.CANCELLED);
      expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    });

    it('Debería rechazar transiciones inválidas directas', () => {
      const order = new Order(validProps()); // CART
      expect(order.canTransitionTo(OrderStatus.DELIVERED)).toBe(false);
      expect(() => order.changeStatus(OrderStatus.DELIVERED)).toThrow(ValidationError);
      expect(() => order.changeStatus(OrderStatus.IN_TRANSIT)).toThrow(ValidationError);
      expect(() => order.changeStatus(OrderStatus.CANCELLED)).toThrow(ValidationError);
    });
  });

  describe('Asociación de Invoice y Shipping', () => {
    it('Debería asignar y obtener invoice', () => {
      const order = new Order(validProps());
      const invoice = new Invoice({
        subtotal: 1000,
        tax: 210,
        shippingCost: 500,
        total: 1710,
      });
      order.setInvoice(invoice);
      expect(order.getInvoice()?.getTotal()).toBe(1710);
      expect(order.getInvoice()?.getInvoiceType()).toBe('B');
    });

    it('Debería asignar y obtener shipping', () => {
      const order = new Order(validProps());
      const shipping = new Shipping({
        address: 'Av. Siempre Viva 742',
        cost: 500,
        provinceName: 'Buenos Aires',
      });
      order.setShipping(shipping);
      expect(order.getShipping()?.getAddress()).toBe('Av. Siempre Viva 742');
      expect(order.getShipping()?.getCost()).toBe(500);

      shipping.setTrackingCode('TRK-1234');
      expect(order.getShipping()?.getTrackingCode()).toBe('TRK-1234');
    });
  });
});
