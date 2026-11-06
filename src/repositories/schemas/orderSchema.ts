import { Schema, Types, model } from 'mongoose';
import { OrderStatus } from '../../models/order';

export interface OrderItemRecord {
  productId: Types.ObjectId;
  sellerId?: Types.ObjectId;
  quantity: number;
  recordedSalePrice?: number;
}

export interface InvoiceRecord {
  invoiceType: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  date: Date;
}

export interface ShippingRecord {
  address?: string;
  provinceId?: Types.ObjectId;
  provinceName?: string;
  cost: number;
  trackingCode?: string;
}

export interface OrderRecord {
  userId: Types.ObjectId;
  orderStatus: OrderStatus;
  items: OrderItemRecord[];
  invoice?: InvoiceRecord;
  shipping?: ShippingRecord;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItemRecord>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
    quantity: { type: Number, required: true, min: 1 },
    recordedSalePrice: { type: Number, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceRecord>(
  {
    invoiceType: { type: String, required: true, default: 'B' },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const shippingSchema = new Schema<ShippingRecord>(
  {
    address: { type: String, trim: true },
    provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
    provinceName: { type: String, trim: true },
    cost: { type: Number, required: true, default: 0, min: 0 },
    trackingCode: { type: String, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
      default: OrderStatus.CART,
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    invoice: { type: invoiceSchema },
    shipping: { type: shippingSchema },
  },
  { timestamps: true },
);

orderSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { orderStatus: OrderStatus.CART },
  },
);

export const OrderModel = model<OrderRecord>('Order', orderSchema);
