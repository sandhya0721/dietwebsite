import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: 'Basic' | 'Standard' | 'Premium';
  slug: string;
  saladsPerDay: number;
  daysPerMonth: number;
  price: number;
  discountPercent: number;
  freeDelivery: boolean;
  targetAudience: string;
  description: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Basic', 'Standard', 'Premium'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    saladsPerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    daysPerMonth: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    freeDelivery: {
      type: Boolean,
      default: false,
    },
    targetAudience: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
