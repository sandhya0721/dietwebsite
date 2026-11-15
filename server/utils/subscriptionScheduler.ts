import mongoose from 'mongoose';
import { Order } from '../models/Order.ts';
import { IPlan } from '../models/Plan.ts';
import { ISalad, Salad } from '../models/Salad.ts';

/**
 * Generates an array of delivery Dates starting from startDate for `daysCount` delivery days.
 * - For 26 days/month: skips Sundays (Mon–Sat deliveries)
 * - For 20 days/month: skips Saturdays & Sundays (Mon–Fri deliveries)
 */
export function computeDeliveryDates(startDate: Date, daysCount: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(12, 0, 0, 0);

  const skipSaturday = daysCount <= 20;

  while (dates.length < daysCount) {
    const dayOfWeek = cursor.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (!isSunday && !(skipSaturday && isSaturday)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const suffix = Date.now().toString().slice(-4);
  return `VB-${suffix}${rand}`;
}

/**
 * Auto-generates daily scheduled orders for a newly activated monthly subscription.
 */
export async function generateSubscriptionDailyOrders(params: {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  plan: IPlan;
  startDate: Date;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress: string;
  postalCode?: string;
  timeSlot: string;
  preferredSalad?: ISalad | null;
}): Promise<{ count: number; endDate: Date }> {
  const {
    userId,
    subscriptionId,
    plan,
    startDate,
    recipientName = '',
    recipientPhone = '',
    deliveryAddress,
    postalCode = '',
    timeSlot,
    preferredSalad,
  } = params;

  const deliveryDates = computeDeliveryDates(startDate, plan.daysPerMonth);
  const endDate = deliveryDates[deliveryDates.length - 1] || new Date(startDate);

  const availableSalads = await Salad.find({ isAvailable: true });
  const fallbackSalad = preferredSalad || availableSalads[0];

  if (!fallbackSalad) {
    return { count: 0, endDate };
  }

  const ordersToInsert = deliveryDates.map((scheduledDate, idx) => {
    const chosenSalad =
      preferredSalad || availableSalads[idx % availableSalads.length] || fallbackSalad;

    return {
      orderNumber: `VB-SUB-${Date.now().toString().slice(-4)}-${idx + 1}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      user: userId,
      subscription: subscriptionId,
      orderType: 'subscription' as const,
      scheduledFor: scheduledDate,
      items: [
        {
          itemType: 'salad' as const,
          salad: chosenSalad._id,
          name: chosenSalad.name,
          imageUrl: chosenSalad.imageUrl,
          quantity: plan.saladsPerDay,
          unitPrice: chosenSalad.price,
          calories: chosenSalad.calories,
          customizationsSummary: `${plan.name} Daily Plan · ${plan.saladsPerDay} bowl${
            plan.saladsPerDay > 1 ? 's' : ''
          }/day`,
        },
      ],
      subtotal: chosenSalad.price * plan.saladsPerDay,
      discountPercent: plan.discountPercent,
      discountAmount: chosenSalad.price * plan.saladsPerDay,
      deliveryFee: 0,
      totalAmount: 0,
      recipientName,
      recipientPhone,
      deliveryAddress,
      postalCode,
      timeSlot,
      status: idx === 0 ? ('Preparing' as const) : ('Pending' as const),
      paymentMethod: 'Cash on Delivery' as const,
      paymentStatus: 'Included in Plan' as const,
    };
  });

  await Order.insertMany(ordersToInsert);
  return { count: ordersToInsert.length, endDate };
}
