import { Router } from 'express';
import {
  listIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../controllers/ingredientController.ts';
import { protect, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', listIngredients);
router.post('/', protect, requireRole('admin'), createIngredient);
router.put('/:id', protect, requireRole('admin'), updateIngredient);
router.delete('/:id', protect, requireRole('admin'), deleteIngredient);

export default router;
