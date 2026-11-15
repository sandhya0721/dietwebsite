import { Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription.ts';
import { Order } from '../models/Order.ts';
import { User } from '../models/User.ts';
import { AuthRequest } from '../middleware/auth.ts';

/**
 * GET /api/subscriptions/my
 * Lists subscriptions for the logged-in member.
 */
export async function getMySubscriptions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscriptions = await Subscription.find({ user: req.user?._id })
      .populate('plan preferredSalad')
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/subscriptions (Admin)
 * Lists all member subscriptions across the business.
 */
export async function listAllSubscriptions(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscriptions = await Subscription.find({})
      .populate('user', 'name email phone')
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/subscriptions/:id/pause
 * Pauses an active subscription.
 */
export async function pauseSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user?._id,
    }).populate('plan');

    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }
    if (sub.status !== 'active') {
      res.status(400).json({ message: 'Only active subscriptions can be paused.' });
      return;
    }

    sub.status = 'paused';
    sub.pausedAt = new Date();
    await sub.save();

    res.json({ message: 'Subscription paused.', subscription: sub });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/subscriptions/:id/resume
 * Resumes a paused subscription and shifts endDate forward by paused days.
 */
export async function resumeSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user?._id,
    }).populate('plan');

    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }
    if (sub.status !== 'paused') {
      res.status(400).json({ message: 'Only paused subscriptions can be resumed.' });
      return;
    }

    const now = new Date();
    let pausedDays = 1;
    if (sub.pausedAt) {
      const diffMs = now.getTime() - new Date(sub.pausedAt).getTime();
      pausedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const newEndDate = new Date(sub.endDate);
    newEndDate.setDate(newEndDate.getDate() + pausedDays);

    sub.status = 'active';
    sub.pausedAt = null;
    sub.totalPausedDays += pausedDays;
    sub.endDate = newEndDate;
    await sub.save();

    res.json({ message: 'Subscription resumed.', subscription: sub });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/subscriptions/:id/cancel
 * Cancels a subscription and cancels remaining future Pending subscription orders.
 */
export async function cancelSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query =
      req.user?.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user?._id };

    const sub = await Subscription.findOne(query).populate('plan');
    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }

    sub.status = 'cancelled';
    await sub.save();

    await User.findByIdAndUpdate(sub.user, { $set: { activePlan: null } });

    await Order.updateMany(
      {
        subscription: sub._id,
        status: 'Pending',
        scheduledFor: { $gte: new Date() },
      },
      { $set: { status: 'Cancelled' } }
    );

    res.json({ message: 'Subscription cancelled.', subscription: sub });
  } catch (err) {
    next(err);
  }
}
