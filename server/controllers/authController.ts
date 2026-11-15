import { Response, NextFunction } from 'express';
import { User } from '../models/User.ts';
import { AuthRequest, signToken } from '../middleware/auth.ts';
import { Subscription } from '../models/Subscription.ts';

/**
 * POST /api/auth/register
 * Registers a new member account and returns JWT + user profile.
 */
export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !address || !password) {
      res.status(400).json({ message: 'All registration fields are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      password,
      role: 'member',
      isActive: true,
    });

    const token = signToken(String(user._id), user.role);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        activePlan: null,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticates admin or member account with email & password.
 */
export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('activePlan');

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: 'This account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Sync active subscription plan if one is active
    const activeSub = await Subscription.findOne({
      user: user._id,
      status: 'active',
    }).populate('plan');

    const token = signToken(String(user._id), user.role);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        activePlan: activeSub ? activeSub.plan : user.activePlan,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user profile.
 */
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user?._id).populate('activePlan');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const activeSub = await Subscription.findOne({
      user: user._id,
      status: 'active',
    }).populate('plan');

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        activePlan: activeSub ? activeSub.plan : user.activePlan,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
}
