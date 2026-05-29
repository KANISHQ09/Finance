import { Schema, model, models, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: 'GROWTH' | 'INCOME' | 'PRESERVATION';
  preferredSectors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    riskTolerance: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    investmentGoals: {
      type: String,
      enum: ['GROWTH', 'INCOME', 'PRESERVATION'],
      default: 'GROWTH',
    },
    preferredSectors: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);
