import { Schema, model } from "mongoose";

export interface ProvinceRecord {
  name: string;
  shippingCost: number;
}

const provinceSchema = new Schema<ProvinceRecord>(
  {
    name: { type: String, required: true, unique: true },
    shippingCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const ProvinceModel = model<ProvinceRecord>("Province", provinceSchema);
