import { Types, isValidObjectId } from 'mongoose';
import { IOrderRepository } from '../interfaces/orderRepository';
import { Invoice } from '../models/invoice';
import { Order } from '../models/order';
import { OrderItem } from '../models/orderItems';
import { Shipping } from '../models/shipping';
import { InvoiceRecord, OrderItemRecord, OrderModel, OrderRecord, ShippingRecord } from './schemas/orderSchema';

interface StoredOrder extends OrderRecord {
  _id: Types.ObjectId;
}

export class OrderRepository implements IOrderRepository {
  public async save(order: Order): Promise<void> {
    const itemsData: OrderItemRecord[] = order.getItems().map((item) => {
      const record: OrderItemRecord = {
        productId: new Types.ObjectId(item.getProductId()),
        quantity: item.getQuantity(),
      };
      if (item.getSellerId()) {
        record.sellerId = new Types.ObjectId(item.getSellerId());
      }
      if (item.getRecordedSalePrice() !== undefined) {
        record.recordedSalePrice = item.getRecordedSalePrice();
      }
      return record;
    });

    let invoiceData: InvoiceRecord | undefined = undefined;
    const invoice = order.getInvoice();
    if (invoice) {
      invoiceData = {
        invoiceType: invoice.getInvoiceType(),
        subtotal: invoice.getSubtotal(),
        tax: invoice.getTax(),
        shippingCost: invoice.getShippingCost(),
        total: invoice.getTotal(),
        date: invoice.getDate(),
      };
    }

    let shippingData: ShippingRecord | undefined = undefined;
    const shipping = order.getShipping();
    if (shipping) {
      shippingData = {
        cost: shipping.getCost(),
        address: shipping.getAddress(),
        provinceName: shipping.getProvinceName(),
        trackingCode: shipping.getTrackingCode(),
      };
      if (shipping.getProvinceId() && isValidObjectId(shipping.getProvinceId())) {
        shippingData.provinceId = new Types.ObjectId(shipping.getProvinceId());
      }
    }

    const data = {
      userId: new Types.ObjectId(order.getUserId()),
      orderStatus: order.getOrderStatus(),
      items: itemsData,
      invoice: invoiceData,
      shipping: shippingData,
    };

    const id = order.getId();
    if (id === undefined) {
      const record = await OrderModel.create(data);
      order.assignId(record._id.toString());
    } else {
      await OrderModel.findByIdAndUpdate(id, data, { runValidators: true });
    }
  }

  public async findById(id: string): Promise<Order | null> {
    if (!isValidObjectId(id)) return null;

    const record = await OrderModel.findById(id).lean<StoredOrder>();
    if (!record) return null;

    return this.toEntity(record);
  }

  public async findCartByUserId(userId: string): Promise<Order | null> {
    if (!isValidObjectId(userId)) return null;

    const record = await OrderModel.findOne({
      userId: new Types.ObjectId(userId),
      orderStatus: 'CART',
    }).lean<StoredOrder>();
    if (!record) return null;

    return this.toEntity(record);
  }

  public async findByUserId(userId: string): Promise<Order[]> {
    if (!isValidObjectId(userId)) return [];

    const records = await OrderModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean<StoredOrder[]>();

    return records.map((record) => this.toEntity(record));
  }

  public async findBySellerId(sellerId: string): Promise<Order[]> {
    if (!isValidObjectId(sellerId)) return [];

    const records = await OrderModel.find({
      'items.sellerId': new Types.ObjectId(sellerId),
    })
      .sort({ createdAt: -1 })
      .lean<StoredOrder[]>();

    return records.map((record) => this.toEntity(record));
  }

  public async findAll(): Promise<Order[]> {
    const records = await OrderModel.find().sort({ createdAt: -1 }).lean<StoredOrder[]>();

    return records.map((record) => this.toEntity(record));
  }

  private toEntity(record: StoredOrder): Order {
    const items = record.items.map(
      (item) =>
        new OrderItem({
          productId: item.productId.toString(),
          sellerId: item.sellerId ? item.sellerId.toString() : undefined,
          quantity: item.quantity,
          recordedSalePrice: item.recordedSalePrice,
        }),
    );

    let invoice: Invoice | undefined = undefined;
    if (record.invoice) {
      invoice = new Invoice({
        invoiceType: record.invoice.invoiceType,
        subtotal: record.invoice.subtotal,
        tax: record.invoice.tax,
        shippingCost: record.invoice.shippingCost,
        total: record.invoice.total,
        date: record.invoice.date,
      });
    }

    let shipping: Shipping | undefined = undefined;
    if (record.shipping) {
      shipping = new Shipping({
        address: record.shipping.address,
        provinceId: record.shipping.provinceId ? record.shipping.provinceId.toString() : undefined,
        provinceName: record.shipping.provinceName,
        cost: record.shipping.cost,
        trackingCode: record.shipping.trackingCode,
      });
    }

    const order = new Order({
      userId: record.userId.toString(),
      orderStatus: record.orderStatus,
      items,
      invoice,
      shipping,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    order.assignId(record._id.toString());
    return order;
  }
}
