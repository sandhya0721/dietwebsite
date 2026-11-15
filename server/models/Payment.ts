import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId | null;
  order?: mongoose.Types.ObjectId | null;
  referenceCode: string;
  amount: number;
  currency: string;
  status: 'pending_cod' | 'collected' | 'cancelled';
  method: 'Cash on Delivery';
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    referenceCode: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending_cod', 'collected', 'cancelled'],
      default: 'pending_cod',
    },
    method: {
      type: String,
      enum: ['Cash on Delivery'],
      default: 'Cash on Delivery',
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
