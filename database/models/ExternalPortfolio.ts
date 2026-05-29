import mongoose, { Schema, Document } from "mongoose";

export interface IExternalAsset {
  symbol: string;
  assetType: "stock" | "crypto" | "gold" | "real_estate" | "mutual_fund" | "other";
  quantity: number;
  avgBuyPrice: number;
  currency: string;
  broker?: string;
  currentPrice?: number;
  lastUpdated?: Date;
  notes?: string;
}

export interface IExternalPortfolio extends Document {
  userId: string;
  assets: IExternalAsset[];
  createdAt: Date;
  updatedAt: Date;
}

const ExternalAssetSchema = new Schema<IExternalAsset>({
  symbol:       { type: String, required: true },
  assetType:    { type: String, enum: ["stock", "crypto", "gold", "real_estate", "mutual_fund", "other"], required: true },
  quantity:     { type: Number, required: true },
  avgBuyPrice:  { type: Number, required: true },
  currency:     { type: String, default: "INR" },
  broker:       { type: String },
  currentPrice: { type: Number },
  lastUpdated:  { type: Date, default: Date.now },
  notes:        { type: String },
});

const ExternalPortfolioSchema = new Schema<IExternalPortfolio>(
  { userId: { type: String, required: true, index: true }, assets: [ExternalAssetSchema] },
  { timestamps: true }
);

export const ExternalPortfolio =
  mongoose.models.ExternalPortfolio ||
  mongoose.model<IExternalPortfolio>("ExternalPortfolio", ExternalPortfolioSchema);
