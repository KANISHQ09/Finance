import mongoose, { Schema, Document } from "mongoose";

export interface IStockAlert extends Document {
  userId: string;
  email: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    symbol: { type: String, required: true, index: true },
    targetPrice: { type: Number, required: true },
    condition: { type: String, enum: ["ABOVE", "BELOW"], required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const StockAlert =
  mongoose.models.StockAlert ||
  mongoose.model<IStockAlert>("StockAlert", StockAlertSchema);
