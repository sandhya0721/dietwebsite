import { Router } from 'express';
import {
  listMyCustomSalads,
  createCustomSalad,
  toggleFavoriteCustomSalad,
  deleteCustomSalad,
} from '../controllers/customSaladController.ts';
import { protect } from '../middleware/auth.ts';

const router = Router();

router.use(protect);
router.get('/', listMyCustomSalads);
router.post('/', createCustomSalad);
router.patch('/:id/favorite', toggleFavoriteCustomSalad);
router.delete('/:id', deleteCustomSalad);

export default router;
