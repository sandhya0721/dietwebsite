import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  pausedAt?: Date | null;
  totalPausedDays: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  postalCode: string;
  timeSlot: string;
  preferredSalad?: mongoose.Types.ObjectId | null;
  paymentMethod: 'Cash on Delivery';
  codStatus: 'Due on First Delivery' | 'Collected';
  amountPaid: number;
  dailyOrdersGenerated: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    totalPausedDays: {
      type: Number,
      default: 0,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    recipientPhone: {
      type: String,
      default: '',
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      default: '',
      trim: true,
    },
    timeSlot: {
      type: String,
      required: true,
      default: '12:00 PM - 1:30 PM',
    },
    preferredSalad: {
      type: Schema.Types.ObjectId,
      ref: 'Salad',
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery'],
      default: 'Cash on Delivery',
    },
    codStatus: {
      type: String,
      enum: ['Due on First Delivery', 'Collected'],
      default: 'Due on First Delivery',
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyOrdersGenerated: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  subscriptionSchema
);
