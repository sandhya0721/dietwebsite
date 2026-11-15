import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.ts';
import { protect, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(protect);
router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/', requireRole('admin'), listAllOrders);
router.patch('/:id/status', requireRole('admin'), updateOrderStatus);

export default router;
