import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.ts';
import { Plan } from '../models/Plan.ts';
import { Order } from '../models/Order.ts';
import { Subscription } from '../models/Subscription.ts';
import { Salad } from '../models/Salad.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { generateSubscriptionDailyOrders } from '../utils/subscriptionScheduler.ts';

/**
 * GET /api/members/overview (Admin)
 * Returns aggregate metrics for the Admin Dashboard.
 */
export async function getAdminOverview(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalMembers,
      activeMembers,
      totalOrders,
      pendingOrders,
      activeSubscriptions,
      totalSalads,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      User.countDocuments({ role: 'member', isActive: true }),
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } }),
      Subscription.countDocuments({ status: 'active' }),
      Salad.countDocuments({ isAvailable: true }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user', 'name email'),
    ]);

    const subRevenueResult = await Subscription.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    const orderRevenue = revenueResult[0]?.total || 0;
    const subscriptionRevenue = subRevenueResult[0]?.total || 0;

    res.json({
      metrics: {
        totalMembers,
        activeMembers,
        totalOrders,
        pendingOrders,
        activeSubscriptions,
        totalSalads,
        totalRevenue: orderRevenue + subscriptionRevenue,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/members (Admin)
 * Lists members with optional search, status filter, and plan filter.
 */
export async function listMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search = '', status = 'all', plan = 'all' } = req.query as Record<
      string,
      string
    >;

    const filter: Record<string, unknown> = { role: 'member' };

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    if (plan && plan !== 'all') {
      if (plan === 'none') {
        filter.activePlan = null;
      } else if (mongoose.Types.ObjectId.isValid(plan)) {
        filter.activePlan = plan;
      }
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const members = await User.find(filter)
      .populate('activePlan')
      .sort({ createdAt: -1 });

    res.json({ members });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/members (Admin)
 * Adds a new member with server-side validation and optional initial plan assignment.
 */
export async function createMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, phone, address, password, planId } = req.body;

    if (!name || !email || !phone || !address || !password) {
      res.status(400).json({
        message: 'Name, email, phone, address, and password are all required.',
      });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'A member with this email already exists.' });
      return;
    }

    let selectedPlan = null;
    if (planId) {
      selectedPlan = await Plan.findById(planId);
      if (!selectedPlan) {
        res.status(400).json({ message: 'Selected membership plan was not found.' });
        return;
      }
    }

    const member = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      password,
      role: 'member',
      activePlan: selectedPlan ? selectedPlan._id : null,
      isActive: true,
    });

    // If an admin assigns a plan while creating a member, activate the subscription too
    if (selectedPlan) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const subId = new mongoose.Types.ObjectId();

      const { count, endDate } = await generateSubscriptionDailyOrders({
        userId: member._id as mongoose.Types.ObjectId,
        subscriptionId: subId,
        plan: selectedPlan,
        startDate,
        deliveryAddress: member.address,
        timeSlot: '12:00 PM - 1:30 PM',
      });

      await Subscription.create({
        _id: subId,
        user: member._id,
        plan: selectedPlan._id,
        status: 'active',
        startDate,
        endDate,
        recipientName: member.name,
        recipientPhone: member.phone,
        deliveryAddress: member.address,
        postalCode: '560034',
        timeSlot: '12:00 PM - 1:30 PM',
        paymentMethod: 'Cash on Delivery',
        codStatus: 'Due on First Delivery',
        amountPaid: selectedPlan.price,
        dailyOrdersGenerated: count,
      });
    }

    const populated = await User.findById(member._id).populate('activePlan');
    res.status(201).json({ member: populated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/members/:id (Admin)
 * Soft deletes a member (isActive = false) and pauses/cancels pending subscription orders.
 */
export async function removeMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const member = await User.findOne({ _id: req.params.id, role: 'member' });
    if (!member) {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }

    member.isActive = false;
    await member.save();

    await Subscription.updateMany(
      { user: member._id, status: { $in: ['active', 'paused'] } },
      { $set: { status: 'cancelled' } }
    );

    await Order.updateMany(
      { user: member._id, status: 'Pending' },
      { $set: { status: 'Cancelled' } }
    );

    const populated = await User.findById(member._id).populate('activePlan');
    res.json({
      message: 'Member deactivated successfully.',
      member: populated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/members/:id/reactivate (Admin)
 * Restores a soft-deleted member.
 */
export async function reactivateMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'member' },
      { $set: { isActive: true } },
      { new: true }
    ).populate('activePlan');

    if (!member) {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }

    res.json({ message: 'Member reactivated.', member });
  } catch (err) {
    next(err);
  }
}
