import { Router } from 'express';
import {
  listSalads,
  getSalad,
  createSalad,
  updateSalad,
  deleteSalad,
} from '../controllers/saladController.ts';
import { protect, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', listSalads);
router.get('/:id', getSalad);
router.post('/', protect, requireRole('admin'), createSalad);
router.put('/:id', protect, requireRole('admin'), updateSalad);
router.delete('/:id', protect, requireRole('admin'), deleteSalad);

export default router;
