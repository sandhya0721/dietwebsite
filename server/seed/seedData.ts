import mongoose from 'mongoose';
import { Plan } from '../models/Plan.ts';
import { Salad } from '../models/Salad.ts';
import { Ingredient } from '../models/Ingredient.ts';
import { User } from '../models/User.ts';
import { Subscription } from '../models/Subscription.ts';
import { Order } from '../models/Order.ts';
import { Payment } from '../models/Payment.ts';
import { generateSubscriptionDailyOrders } from '../utils/subscriptionScheduler.ts';

const SEED_INGREDIENTS = [
  // Bases
  { name: 'Crisp Romaine Lettuce', category: 'base', price: 79, calories: 35, proteinGrams: 2, carbsGrams: 6, fatGrams: 0, isVeg: true, isVegan: true },
  { name: 'Baby Spinach Leaves', category: 'base', price: 89, calories: 40, proteinGrams: 4, carbsGrams: 5, fatGrams: 1, isVeg: true, isVegan: true },
  { name: 'Massaged Tuscan Kale', category: 'base', price: 99, calories: 50, proteinGrams: 4, carbsGrams: 7, fatGrams: 1, isVeg: true, isVegan: true },
  { name: 'Tri-Color Organic Quinoa', category: 'base', price: 119, calories: 165, proteinGrams: 6, carbsGrams: 29, fatGrams: 3, isVeg: true, isVegan: true },

  // Proteins
  { name: 'Herb Grilled Paneer', category: 'protein', price: 75, calories: 185, proteinGrams: 14, carbsGrams: 3, fatGrams: 13, isVeg: true, isVegan: false },
  { name: 'Crispy Sesame Tofu', category: 'protein', price: 70, calories: 145, proteinGrams: 15, carbsGrams: 5, fatGrams: 8, isVeg: true, isVegan: true },
  { name: 'Charred Herb Chicken', category: 'protein', price: 95, calories: 190, proteinGrams: 28, carbsGrams: 1, fatGrams: 7, isVeg: false, isVegan: false },
  { name: 'Spiced Roasted Chickpeas', category: 'protein', price: 55, calories: 135, proteinGrams: 8, carbsGrams: 21, fatGrams: 3, isVeg: true, isVegan: true },
  { name: 'Soft-Boiled Farm Egg (2x)', category: 'protein', price: 60, calories: 155, proteinGrams: 13, carbsGrams: 1, fatGrams: 11, isVeg: false, isVegan: false },

  // Toppings
  { name: 'English Cucumber Ribbons', category: 'topping', price: 25, calories: 15, proteinGrams: 1, carbsGrams: 3, fatGrams: 0, isVeg: true, isVegan: true },
  { name: 'Heirloom Cherry Tomatoes', category: 'topping', price: 30, calories: 22, proteinGrams: 1, carbsGrams: 4, fatGrams: 0, isVeg: true, isVegan: true },
  { name: 'Kalamata Olives', category: 'topping', price: 40, calories: 45, proteinGrams: 0, carbsGrams: 2, fatGrams: 4, isVeg: true, isVegan: true },
  { name: 'Toasted Almonds & Walnuts', category: 'topping', price: 45, calories: 95, proteinGrams: 3, carbsGrams: 3, fatGrams: 8, isVeg: true, isVegan: true },
  { name: 'Roasted Pumpkin & Chia Seeds', category: 'topping', price: 35, calories: 75, proteinGrams: 4, carbsGrams: 4, fatGrams: 5, isVeg: true, isVegan: true },

  // Dressings
  { name: 'Cold-Pressed Olive Oil & Herb', category: 'dressing', price: 25, calories: 90, proteinGrams: 0, carbsGrams: 1, fatGrams: 10, isVeg: true, isVegan: true },
  { name: 'Zesty Lemon Vinaigrette', category: 'dressing', price: 25, calories: 65, proteinGrams: 0, carbsGrams: 3, fatGrams: 6, isVeg: true, isVegan: true },
  { name: 'Greek Yogurt & Mint', category: 'dressing', price: 30, calories: 55, proteinGrams: 3, carbsGrams: 4, fatGrams: 3, isVeg: true, isVegan: false },
  { name: 'Aged Balsamic Reduction', category: 'dressing', price: 30, calories: 50, proteinGrams: 0, carbsGrams: 8, fatGrams: 2, isVeg: true, isVegan: true },
];

/**
 * Seeds sample plans, salads, ingredients, demo admin/members, and starter orders.
 * Safe to run on boot: skips seeding if plans already exist, while backfilling macros.
 */
export async function ensureSeeded(forceReset = false): Promise<void> {
  if (forceReset) {
    await Promise.all([
      Plan.deleteMany({}),
      Salad.deleteMany({}),
      Ingredient.deleteMany({}),
      User.deleteMany({}),
      Subscription.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
    ]);
  }

  const existingPlans = await Plan.countDocuments();
  if (existingPlans > 0) {
    // Backfill carbsGrams & fatGrams on previously persisted ingredients
    await Promise.all(
      SEED_INGREDIENTS.map((ing) =>
        Ingredient.updateOne(
          { name: ing.name, carbsGrams: { $exists: false } },
          { $set: { carbsGrams: ing.carbsGrams, fatGrams: ing.fatGrams } }
        )
      )
    );
    return;
  }

  console.log('Seeding Verdant Bowl database...');

  // 1. Seed Membership Plans
  const plans = await Plan.insertMany([
    {
      name: 'Basic',
      slug: 'basic',
      saladsPerDay: 1,
      daysPerMonth: 20,
      price: 2499,
      discountPercent: 10,
      freeDelivery: false,
      targetAudience: 'For weekday lunch routines',
      description:
        'Consistent weekday nutrition with one fresh chef-crafted salad delivered Monday through Friday.',
      features: [
        '1 fresh salad bowl per day',
        '20 delivery days per month (Mon–Fri)',
        '10% member discount on extra orders',
        'Pause or reschedule anytime',
      ],
      isPopular: false,
      isActive: true,
    },
    {
      name: 'Standard',
      slug: 'standard',
      saladsPerDay: 1,
      daysPerMonth: 26,
      price: 3299,
      discountPercent: 15,
      freeDelivery: false,
      targetAudience: 'For steady daily wellness',
      description:
        'Six days a week of macro-balanced bowls tailored to sustain energy, recovery, and clean eating.',
      features: [
        '1 fresh salad bowl per day',
        '26 delivery days per month (Mon–Sat)',
        '15% member discount on extra orders',
        'Swap daily bowls & customize macros',
      ],
      isPopular: true,
      isActive: true,
    },
    {
      name: 'Premium',
      slug: 'premium',
      saladsPerDay: 2,
      daysPerMonth: 26,
      price: 5499,
      discountPercent: 25,
      freeDelivery: true,
      targetAudience: 'For full-day fitness & families',
      description:
        'Lunch and dinner bowls delivered six days a week with complimentary express delivery on every order.',
      features: [
        '2 fresh salad bowls per day',
        '26 delivery days per month (Mon–Sat)',
        '25% member discount on extra orders',
        'Free priority delivery on all orders',
      ],
      isPopular: false,
      isActive: true,
    },
  ]);

  const standardPlan = plans.find((p) => p.name === 'Standard')!;
  const basicPlan = plans.find((p) => p.name === 'Basic')!;

  // 2. Seed Ingredients for Custom Salad Builder
  await Ingredient.insertMany(SEED_INGREDIENTS);

  // 3. Seed Signature Salads
  const salads = await Salad.insertMany([
    {
      name: 'Mediterranean Quinoa Power Bowl',
      description:
        'Tri-color organic quinoa tossed with English cucumber, heirloom cherry tomatoes, Kalamata olives, crumbled cheese, roasted chickpeas, and lemon-oregano vinaigrette.',
      price: 289,
      calories: 420,
      proteinGrams: 18,
      carbsGrams: 46,
      fatGrams: 16,
      imageUrl: '/src/assets/images/salad_mediterranean_quinoa_1794716475366.jpg',
      category: 'Signature',
      dietaryTag: 'Veg',
      isVeg: true,
      isVegan: false,
      ingredientsList: ['Tri-Color Quinoa', 'Cucumber', 'Cherry Tomatoes', 'Kalamata Olives', 'Chickpeas', 'Lemon Dressing'],
      isAvailable: true,
    },
    {
      name: 'Grilled Herb Chicken Protein Bowl',
      description:
        'Charred rosemary-garlic chicken breast layered over baby spinach, ripe avocado slices, heirloom tomatoes, and toasted almonds with cold-pressed olive oil.',
      price: 349,
      calories: 485,
      proteinGrams: 38,
      carbsGrams: 19,
      fatGrams: 26,
      imageUrl: '/src/assets/images/salad_grilled_herb_chicken_1794716476184.jpg',
      category: 'High-Protein',
      dietaryTag: 'High-Protein',
      isVeg: false,
      isVegan: false,
      ingredientsList: ['Grilled Chicken', 'Baby Spinach', 'Avocado', 'Cherry Tomatoes', 'Toasted Almonds', 'Olive Oil'],
      isAvailable: true,
    },
    {
      name: 'Crispy Sesame Tofu & Massaged Kale',
      description:
        'Golden sesame-crusted organic tofu served atop hand-massaged Tuscan kale, purple cabbage crunch, pumpkin seeds, and bright tahini-lemon drizzle.',
      price: 299,
      calories: 390,
      proteinGrams: 22,
      carbsGrams: 31,
      fatGrams: 19,
      imageUrl: '/src/assets/images/salad_crispy_tofu_kale_1794716476425.jpg',
      category: 'Harvest',
      dietaryTag: 'Vegan',
      isVeg: true,
      isVegan: true,
      ingredientsList: ['Tuscan Kale', 'Crispy Tofu', 'Purple Cabbage', 'Pumpkin Seeds', 'Cucumber', 'Lemon Tahini'],
      isAvailable: true,
    },
    {
      name: 'Spiced Paneer & Chickpea Harvest',
      description:
        'Warm charred paneer cubes and crunchy roasted chickpeas over crisp seasonal greens, cucumber ribbons, and cooling Greek yogurt-mint dressing.',
      price: 319,
      calories: 460,
      proteinGrams: 24,
      carbsGrams: 34,
      fatGrams: 23,
      imageUrl: '/src/assets/images/salad_paneer_tikka_harvest_1794716477208.jpg',
      category: 'High-Protein',
      dietaryTag: 'Veg',
      isVeg: true,
      isVegan: false,
      ingredientsList: ['Charred Paneer', 'Roasted Chickpeas', 'Baby Greens', 'Cucumber', 'Pumpkin Seeds', 'Yogurt Mint'],
      isAvailable: true,
    },
    {
      name: 'Emerald Garden Green Detox',
      description:
        'Crisp romaine hearts and baby kale paired with green apple slices, creamy avocado, cucumber, and toasted walnuts finished with aged balsamic and olive oil.',
      price: 259,
      calories: 310,
      proteinGrams: 10,
      carbsGrams: 24,
      fatGrams: 19,
      imageUrl: '/src/assets/images/salad_garden_green_detox_1794716477502.jpg',
      category: 'Detox',
      dietaryTag: 'Vegan',
      isVeg: true,
      isVegan: true,
      ingredientsList: ['Romaine Lettuce', 'Baby Kale', 'Green Apple', 'Avocado', 'Walnuts', 'Olive Oil & Lemon'],
      isAvailable: true,
    },
  ]);

  // 4. Seed Admin & Sample Members
  const adminUser = await User.create({
    name: 'Aarav Mehta',
    email: 'admin@verdantbowl.in',
    phone: '+91 98201 11223',
    address: 'Verdant Kitchen HQ, Indiranagar 100ft Rd, Bengaluru',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });

  const demoMember = await User.create({
    name: 'Priya Nair',
    email: 'member@verdantbowl.in',
    phone: '+91 98450 44556',
    address: '42 Palm Grove Residency, Koramangala 4th Block, Bengaluru',
    password: 'Member@123',
    role: 'member',
    activePlan: standardPlan._id,
    isActive: true,
  });

  const secondMember = await User.create({
    name: 'Rohan Kulkarni',
    email: 'rohan@verdantbowl.in',
    phone: '+91 99001 77889',
    address: '18 Maple Court, HSR Layout Sector 2, Bengaluru',
    password: 'Member@123',
    role: 'member',
    activePlan: basicPlan._id,
    isActive: true,
  });

  await User.create({
    name: 'Sneha Verma',
    email: 'sneha@verdantbowl.in',
    phone: '+91 97412 33445',
    address: '905 Green Terrace, Whitefield, Bengaluru',
    password: 'Member@123',
    role: 'member',
    activePlan: null,
    isActive: true,
  });

  // 5. Seed Active Subscription & Auto-Generated Daily Orders for Priya
  const subStart = new Date();
  subStart.setDate(subStart.getDate() + 1);
  const subId = new mongoose.Types.ObjectId();

  const { count, endDate } = await generateSubscriptionDailyOrders({
    userId: demoMember._id as mongoose.Types.ObjectId,
    subscriptionId: subId,
    plan: standardPlan,
    startDate: subStart,
    recipientName: demoMember.name,
    recipientPhone: demoMember.phone,
    deliveryAddress: demoMember.address,
    postalCode: '560034',
    timeSlot: '12:00 PM - 1:30 PM',
    preferredSalad: salads[0],
  });

  await Subscription.create({
    _id: subId,
    user: demoMember._id,
    plan: standardPlan._id,
    status: 'active',
    startDate: subStart,
    endDate,
    recipientName: demoMember.name,
    recipientPhone: demoMember.phone,
    deliveryAddress: demoMember.address,
    postalCode: '560034',
    timeSlot: '12:00 PM - 1:30 PM',
    preferredSalad: salads[0]._id,
    paymentMethod: 'Cash on Delivery',
    codStatus: 'Collected',
    amountPaid: standardPlan.price,
    dailyOrdersGenerated: count,
  });

  await Payment.create({
    user: demoMember._id,
    subscription: subId,
    referenceCode: 'COD-SUB-SEED-001',
    amount: standardPlan.price,
    currency: 'INR',
    status: 'collected',
    method: 'Cash on Delivery',
  });

  // 6. Seed Sample One-Time Orders for Admin & Member Visibility
  await Order.create([
    {
      orderNumber: 'VB-1041',
      user: demoMember._id,
      orderType: 'one-time',
      scheduledFor: new Date(),
      items: [
        {
          itemType: 'salad',
          salad: salads[1]._id,
          name: salads[1].name,
          imageUrl: salads[1].imageUrl,
          quantity: 1,
          unitPrice: salads[1].price,
          calories: salads[1].calories,
        },
      ],
      subtotal: salads[1].price,
      discountPercent: 15,
      discountAmount: Math.round(salads[1].price * 0.15),
      deliveryFee: 40,
      totalAmount: salads[1].price - Math.round(salads[1].price * 0.15) + 40,
      recipientName: demoMember.name,
      recipientPhone: demoMember.phone,
      deliveryAddress: demoMember.address,
      postalCode: '560034',
      timeSlot: '12:00 PM - 1:30 PM',
      status: 'Out for Delivery',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Cash on Delivery',
    },
    {
      orderNumber: 'VB-1039',
      user: secondMember._id,
      orderType: 'one-time',
      scheduledFor: new Date(Date.now() - 86400000),
      items: [
        {
          itemType: 'salad',
          salad: salads[2]._id,
          name: salads[2].name,
          imageUrl: salads[2].imageUrl,
          quantity: 2,
          unitPrice: salads[2].price,
          calories: salads[2].calories,
        },
      ],
      subtotal: salads[2].price * 2,
      discountPercent: 10,
      discountAmount: Math.round(salads[2].price * 2 * 0.1),
      deliveryFee: 0,
      totalAmount: salads[2].price * 2 - Math.round(salads[2].price * 2 * 0.1),
      recipientName: secondMember.name,
      recipientPhone: secondMember.phone,
      deliveryAddress: secondMember.address,
      postalCode: '560102',
      timeSlot: '7:00 PM - 8:30 PM',
      status: 'Delivered',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid on Delivery',
    },
  ]);

  console.log(
    `Seed complete. Admin: ${adminUser.email} / Admin@123 | Member: ${demoMember.email} / Member@123`
  );
}

// Allow running directly via `npm run seed`
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('seedData.ts');

if (isDirectRun) {
  (async () => {
    const { connectDB, disconnectDB } = await import('../config/db.ts');
    await connectDB();
    await ensureSeeded(true);
    await disconnectDB();
    process.exit(0);
  })();
}
