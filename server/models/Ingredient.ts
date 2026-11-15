import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient extends Document {
  name: string;
  category: 'base' | 'protein' | 'topping' | 'dressing';
  price: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  isVeg: boolean;
  isVegan: boolean;
  isAvailable: boolean;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['base', 'protein', 'topping', 'dressing'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    proteinGrams: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbsGrams: {
      type: Number,
      default: 0,
      min: 0,
    },
    fatGrams: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isVegan: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Ingredient = mongoose.model<IIngredient>(
  'Ingredient',
  ingredientSchema
);
