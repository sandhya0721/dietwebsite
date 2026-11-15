import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.ts';
import { Salad } from '../models/Salad.ts';
import { CustomSalad } from '../models/CustomSalad.ts';
import { Subscription } from '../models/Subscription.ts';
import { Payment } from '../models/Payment.ts';
import { IPlan } from '../models/Plan.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { generateOrderNumber } from '../utils/subscriptionScheduler.ts';

/**
 * POST /api/orders
 * Places a Cash on Delivery (COD) one-time order and applies active membership discounts.
 */
export async function createOrder(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      items,
      recipientName,
      recipientPhone,
      deliveryAddress,
      postalCode,
      timeSlot,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Your cart is empty.' });
      return;
    }

    const resolvedName = (recipientName || req.user?.name || '').trim();
    const resolvedPhone = (recipientPhone || req.user?.phone || '').trim();
    const resolvedAddress = (deliveryAddress || '').trim();
    const resolvedPostalCode = (postalCode || '').trim();

    if (!resolvedName || !resolvedPhone || !resolvedAddress || !resolvedPostalCode) {
      res.status(400).json({
        message:
          'Name, phone number, delivery address, and postal code are required for Cash on Delivery.',
      });
      return;
    }

    if (!/^\d{5,6}$/.test(resolvedPostalCode)) {
      res.status(400).json({ message: 'Please enter a valid 5 or 6 digit postal code.' });
      return;
    }

    if (!timeSlot) {
      res.status(400).json({ message: 'Please select a delivery time slot.' });
      return;
    }

    const verifiedItems = [];
    let subtotal = 0;

    for (const rawItem of items) {
      const qty = Math.max(1, Number(rawItem.quantity || 1));

      if (rawItem.itemType === 'custom' && rawItem.customSaladId) {
        const custom = await CustomSalad.findById(rawItem.customSaladId).populate(
          'base proteins toppings dressing'
        );
        if (!custom) {
          res.status(400).json({ message: 'Custom salad not found.' });
          return;
        }
        const summaryParts = [
          (custom.base as unknown as { name: string })?.name,
          ...(custom.proteins as unknown as Array<{ name: string }>).map((p) => p.name),
          ...(custom.toppings as unknown as Array<{ name: string }>).map((t) => t.name),
          (custom.dressing as unknown as { name: string })?.name,
        ].filter(Boolean);

        verifiedItems.push({
          itemType: 'custom' as const,
          customSalad: custom._id,
          name: custom.name,
          imageUrl: '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
          quantity: qty,
          unitPrice: custom.totalPrice,
          calories: custom.totalCalories,
          customizationsSummary: summaryParts.join(', '),
          specialInstructions:
            rawItem.specialInstructions || custom.specialInstructions || '',
        });
        subtotal += custom.totalPrice * qty;
      } else if (rawItem.itemType === 'custom' && rawItem.inlineCustom) {
        const inline = rawItem.inlineCustom;
        verifiedItems.push({
          itemType: 'custom' as const,
          name: inline.name || 'Custom Built Salad',
          imageUrl: '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
          quantity: qty,
          unitPrice: Number(inline.totalPrice),
          calories: Number(inline.totalCalories),
          customizationsSummary: inline.summary || '',
          specialInstructions: inline.specialInstructions || '',
        });
        subtotal += Number(inline.totalPrice) * qty;
      } else {
        const salad = await Salad.findById(rawItem.saladId);
        if (!salad) {
          res.status(400).json({ message: 'One of the salads in your cart is unavailable.' });
          return;
        }
        verifiedItems.push({
          itemType: 'salad' as const,
          salad: salad._id,
          name: salad.name,
          imageUrl: salad.imageUrl,
          quantity: qty,
          unitPrice: salad.price,
          calories: salad.calories,
          specialInstructions: rawItem.specialInstructions || '',
        });
        subtotal += salad.price * qty;
      }
    }

    // Apply active membership plan discount
    const activeSub = await Subscription.findOne({
      user: req.user?._id,
      status: 'active',
    }).populate('plan');

    const activePlan =
      (activeSub?.plan as unknown as IPlan | undefined) ||
      (req.user?.activePlan as unknown as IPlan | undefined);

    const discountPercent = activePlan ? activePlan.discountPercent : 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const hasFreeDelivery = Boolean(activePlan?.freeDelivery) || afterDiscount >= 499;
    const deliveryFee = hasFreeDelivery ? 0 : 40;
    const totalAmount = afterDiscount + deliveryFee;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user?._id,
      orderType: 'one-time',
      scheduledFor: new Date(),
      items: verifiedItems,
      subtotal,
      discountPercent,
      discountAmount,
      deliveryFee,
      totalAmount,
      recipientName: resolvedName,
      recipientPhone: resolvedPhone,
      deliveryAddress: resolvedAddress,
      postalCode: resolvedPostalCode,
      timeSlot,
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Cash on Delivery',
    });

    await Payment.create({
      user: req.user?._id,
      order: order._id,
      referenceCode: `COD-${order.orderNumber}`,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending_cod',
      method: 'Cash on Delivery',
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/my
 */
export async function getMyOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { type } = req.query as { type?: string };
    const filter: Record<string, unknown> = { user: req.user?._id };
    if (type === 'one-time' || type === 'subscription') {
      filter.orderType = type;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1, scheduledFor: 1 })
      .limit(100);

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders (Admin)
 */
export async function listAllOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, orderType, search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (orderType && orderType !== 'All') {
      filter.orderType = orderType;
    }
    if (search && search.trim()) {
      filter.orderNumber = new RegExp(search.trim(), 'i');
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(150);

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/orders/:id/status (Admin)
 * Marks COD payment as Paid on Delivery when one-time order is Delivered.
 */
export async function updateOrderStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ message: 'Invalid order status value.' });
      return;
    }

    const existing = await Order.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    existing.status = status;
    if (existing.orderType === 'one-time') {
      if (status === 'Delivered') {
        existing.paymentStatus = 'Paid on Delivery';
        await Payment.findOneAndUpdate(
          { order: existing._id },
          { $set: { status: 'collected' } }
        );
      } else if (status === 'Cancelled') {
        await Payment.findOneAndUpdate(
          { order: existing._id },
          { $set: { status: 'cancelled' } }
        );
      }
    }
    await existing.save();

    const populated = await Order.findById(existing._id).populate(
      'user',
      'name email phone'
    );
    res.json({ order: populated });
  } catch (err) {
    next(err);
  }
}
