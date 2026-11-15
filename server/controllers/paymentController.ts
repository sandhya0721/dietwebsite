import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Plan } from '../models/Plan.ts';
import { Payment } from '../models/Payment.ts';
import { Subscription } from '../models/Subscription.ts';
import { User } from '../models/User.ts';
import { Salad } from '../models/Salad.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { generateSubscriptionDailyOrders } from '../utils/subscriptionScheduler.ts';

/**
 * POST /api/payments/subscribe-cod
 * Activates a monthly membership subscription using Cash on Delivery (no online payment),
 * updates User.activePlan, and auto-generates daily scheduled salad orders.
 */
export async function activateCodSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      planId,
      recipientName,
      recipientPhone,
      deliveryAddress,
      postalCode,
      timeSlot,
      preferredSaladId,
      startDate,
    } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ message: 'Membership plan not found.' });
      return;
    }

    const resolvedName = (recipientName || req.user?.name || '').trim();
    const resolvedPhone = (recipientPhone || req.user?.phone || '').trim();
    const resolvedAddress = (deliveryAddress || req.user?.address || '').trim();
    const resolvedPostal = (postalCode || '').trim();

    if (!resolvedName || !resolvedPhone || !resolvedAddress || !resolvedPostal) {
      res.status(400).json({
        message:
          'Name, phone number, delivery address, and postal code are required for Cash on Delivery.',
      });
      return;
    }

    if (!/^\d{5,6}$/.test(resolvedPostal)) {
      res.status(400).json({ message: 'Please enter a valid 5 or 6 digit postal code.' });
      return;
    }

    // Cancel any previous active/paused subscriptions for this member
    await Subscription.updateMany(
      { user: req.user?._id, status: { $in: ['active', 'paused'] } },
      { $set: { status: 'cancelled' } }
    );

    const parsedStart = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
    const preferredSalad = preferredSaladId
      ? await Salad.findById(preferredSaladId)
      : null;

    const subId = new mongoose.Types.ObjectId();
    const resolvedSlot = timeSlot || '12:00 PM - 1:30 PM';

    const { count, endDate } = await generateSubscriptionDailyOrders({
      userId: req.user!._id as mongoose.Types.ObjectId,
      subscriptionId: subId,
      plan,
      startDate: parsedStart,
      recipientName: resolvedName,
      recipientPhone: resolvedPhone,
      deliveryAddress: resolvedAddress,
      postalCode: resolvedPostal,
      timeSlot: resolvedSlot,
      preferredSalad,
    });

    const subscription = await Subscription.create({
      _id: subId,
      user: req.user?._id,
      plan: plan._id,
      status: 'active',
      startDate: parsedStart,
      endDate,
      recipientName: resolvedName,
      recipientPhone: resolvedPhone,
      deliveryAddress: resolvedAddress,
      postalCode: resolvedPostal,
      timeSlot: resolvedSlot,
      preferredSalad: preferredSalad ? preferredSalad._id : null,
      paymentMethod: 'Cash on Delivery',
      codStatus: 'Due on First Delivery',
      amountPaid: plan.price,
      dailyOrdersGenerated: count,
    });

    await User.findByIdAndUpdate(req.user?._id, {
      $set: { activePlan: plan._id },
    });

    await Payment.create({
      user: req.user?._id,
      subscription: subscription._id,
      referenceCode: `COD-SUB-${Date.now().toString().slice(-6)}`,
      amount: plan.price,
      currency: 'INR',
      status: 'pending_cod',
      method: 'Cash on Delivery',
    });

    const populatedSub = await Subscription.findById(subscription._id).populate(
      'plan preferredSalad'
    );

    res.status(201).json({
      message: `Subscription activated on Cash on Delivery with ${count} daily orders scheduled.`,
      subscription: populatedSub,
      dailyOrdersGenerated: count,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyPayments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payments = await Payment.find({ user: req.user?._id })
      .populate('subscription')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}
