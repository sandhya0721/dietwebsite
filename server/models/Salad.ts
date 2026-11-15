import mongoose, { Document, Schema } from 'mongoose';

export interface ISalad extends Document {
  name: string;
  description: string;
  price: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  imageUrl: string;
  category: 'Signature' | 'High-Protein' | 'Detox' | 'Harvest';
  dietaryTag: 'Veg' | 'Vegan' | 'High-Protein';
  isVeg: boolean;
  isVegan: boolean;
  ingredientsList: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const saladSchema = new Schema<ISalad>(
  {
    name: {
      type: String,
      required: [true, 'Salad name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be positive'],
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: [10, 'Calories must be realistic'],
    },
    proteinGrams: {
      type: Number,
      default: 18,
      min: 0,
    },
    carbsGrams: {
      type: Number,
      default: 32,
      min: 0,
    },
    fatGrams: {
      type: Number,
      default: 14,
      min: 0,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Signature', 'High-Protein', 'Detox', 'Harvest'],
      default: 'Signature',
    },
    dietaryTag: {
      type: String,
      enum: ['Veg', 'Vegan', 'High-Protein'],
      default: 'Veg',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    ingredientsList: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Salad = mongoose.model<ISalad>('Salad', saladSchema);
