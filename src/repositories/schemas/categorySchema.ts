import { Schema, model } from 'mongoose';

export interface CategoryRecord {
  name: string;
  description?: string;
}

const categorySchema = new Schema<CategoryRecord>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

export const CategoryModel = model<CategoryRecord>('Category', categorySchema);
