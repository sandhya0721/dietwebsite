import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.ts';

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'verdant_bowl_dev_secret_change_in_production';

export function signToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies JWT Bearer token and ensures the user account exists and is active.
 */
export async function protect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Please sign in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    const user = await User.findById(decoded.id).populate('activePlan');
    if (!user) {
      res.status(401).json({ message: 'User account no longer exists.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: 'Your membership account has been deactivated. Contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session. Please sign in again.' });
  }
}

/**
 * Role-based access control middleware.
 */
export function requireRole(...roles: Array<'admin' | 'member'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
}
