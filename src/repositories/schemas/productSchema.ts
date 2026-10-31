import { Schema, Types, model } from 'mongoose';

export interface ProductRecord {
  sku: string;
  name: string;
  description: string;
  salePrice: number;
  stock: number;
  categoryId: Types.ObjectId;
  sellerId: Types.ObjectId;
  isActive: boolean;
}

const productSchema = new Schema<ProductRecord>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    salePrice: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, categoryId: 1, createdAt: -1 });

export const ProductModel = model<ProductRecord>('Product', productSchema);
