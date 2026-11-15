import { Router } from 'express';
import {
  activateCodSubscription,
  listMyPayments,
} from '../controllers/paymentController.ts';
import { protect } from '../middleware/auth.ts';

const router = Router();

router.use(protect);
router.post('/subscribe-cod', activateCodSubscription);
router.get('/my', listMyPayments);

export default router;
