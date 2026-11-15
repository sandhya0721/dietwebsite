export type UserRole = 'admin' | 'member';

export interface Plan {
  _id: string;
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

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  activePlan?: Plan | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Salad {
  _id: string;
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
}

export interface Ingredient {
  _id: string;
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

export interface CustomSalad {
  _id: string;
  name: string;
  base: Ingredient;
  proteins: Ingredient[];
  toppings: Ingredient[];
  dressing: Ingredient;
  specialInstructions: string;
  totalPrice: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs?: number;
  totalFat?: number;
  isFavorite: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  itemType: 'salad' | 'custom';
  salad?: string;
  customSalad?: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  customizationsSummary?: string;
  specialInstructions?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User | string;
  subscription?: string | null;
  orderType: 'one-time' | 'subscription';
  scheduledFor: string;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress: string;
  postalCode?: string;
  timeSlot: string;
  status: OrderStatus;
  paymentMethod?: 'Cash on Delivery';
  paymentStatus: 'Cash on Delivery' | 'Paid on Delivery' | 'Included in Plan';
  createdAt: string;
}

export interface Subscription {
  _id: string;
  user: User | string;
  plan: Plan;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  pausedAt?: string | null;
  totalPausedDays: number;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress: string;
  postalCode?: string;
  timeSlot: string;
  preferredSalad?: Salad | null;
  paymentMethod: 'Cash on Delivery';
  codStatus: 'Due on First Delivery' | 'Collected';
  amountPaid: number;
  dailyOrdersGenerated: number;
  createdAt: string;
}

export interface CartItem {
  key: string;
  itemType: 'salad' | 'custom';
  saladId?: string;
  customSaladId?: string;
  inlineCustom?: {
    name: string;
    totalPrice: number;
    totalCalories: number;
    summary: string;
    specialInstructions: string;
  };
  name: string;
  imageUrl: string;
  unitPrice: number;
  calories: number;
  quantity: number;
  customizationsSummary?: string;
  specialInstructions?: string;
}
