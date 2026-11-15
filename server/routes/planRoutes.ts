import { Router } from 'express';
import { listPlans, getPlanById } from '../controllers/planController.ts';

const router = Router();

router.get('/', listPlans);
router.get('/:id', getPlanById);

export default router;
