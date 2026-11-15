import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface IOrderItem {
  itemType: 'salad' | 'custom';
  salad?: mongoose.Types.ObjectId;
  customSalad?: mongoose.Types.ObjectId;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  customizationsSummary?: string;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId | null;
  orderType: 'one-time' | 'subscription';
  scheduledFor: Date;
  items: IOrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  postalCode: string;
  timeSlot: string;
  status: OrderStatus;
  paymentMethod: 'Cash on Delivery';
  paymentStatus: 'Cash on Delivery' | 'Paid on Delivery' | 'Included in Plan';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    itemType: {
      type: String,
      enum: ['salad', 'custom'],
      required: true,
    },
    salad: {
      type: Schema.Types.ObjectId,
      ref: 'Salad',
    },
    customSalad: {
      type: Schema.Types.ObjectId,
      ref: 'CustomSalad',
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    customizationsSummary: {
      type: String,
      default: '',
    },
    specialInstructions: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
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
    orderType: {
      type: String,
      enum: ['one-time', 'subscription'],
      default: 'one-time',
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'Order must contain at least one item',
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      default: '',
      trim: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Delivery time slot is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery'],
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['Cash on Delivery', 'Paid on Delivery', 'Included in Plan'],
      default: 'Cash on Delivery',
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
