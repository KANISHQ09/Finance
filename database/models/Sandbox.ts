import mongoose, { Schema, Document } from "mongoose";

export interface ISandboxPosition {
  ticker: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  openedAt: Date;
}

export interface ISandboxTransaction {
  ticker: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  executedAt: Date;
}

export interface ISandbox extends Document {
  userId: string;
  virtualBalance: number;
  initialBalance: number;
  positions: ISandboxPosition[];
  transactions: ISandboxTransaction[];
  totalPnL: number;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxSchema = new Schema<ISandbox>(
  {
    userId:         { type: String, required: true, unique: true, index: true },
    virtualBalance: { type: Number, default: 100000 },
    initialBalance: { type: Number, default: 100000 },
    positions:      [{ type: Schema.Types.Mixed }],
    transactions:   [{ type: Schema.Types.Mixed }],
    totalPnL:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Sandbox =
  mongoose.models.Sandbox ||
  mongoose.model<ISandbox>("Sandbox", SandboxSchema);
