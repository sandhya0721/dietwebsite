import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomSalad extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  base: mongoose.Types.ObjectId;
  proteins: mongoose.Types.ObjectId[];
  toppings: mongoose.Types.ObjectId[];
  dressing: mongoose.Types.ObjectId;
  specialInstructions: string;
  totalPrice: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customSaladSchema = new Schema<ICustomSalad>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Custom salad name is required'],
      trim: true,
      maxlength: 80,
    },
    base: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    proteins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    toppings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    dressing: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    specialInstructions: {
      type: String,
      default: '',
      maxlength: 250,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCalories: {
      type: Number,
      required: true,
      min: 0,
    },
    totalProtein: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCarbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFat: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFavorite: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const CustomSalad = mongoose.model<ICustomSalad>(
  'CustomSalad',
  customSaladSchema
);
