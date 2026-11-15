import { Request, Response, NextFunction } from 'express';
import { Plan } from '../models/Plan.ts';

export async function listPlans(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json({ plans });
  } catch (err) {
    next(err);
  }
}

export async function getPlanById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ message: 'Membership plan not found.' });
      return;
    }
    res.json({ plan });
  } catch (err) {
    next(err);
  }
}
