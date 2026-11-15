import { Router } from 'express';
import {
  getMySubscriptions,
  listAllSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController.ts';
import { protect, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(protect);
router.get('/my', getMySubscriptions);
router.get('/', requireRole('admin'), listAllSubscriptions);
router.patch('/:id/pause', pauseSubscription);
router.patch('/:id/resume', resumeSubscription);
router.patch('/:id/cancel', cancelSubscription);

export default router;
