import { Router } from 'express';
import {
  getAdminOverview,
  listMembers,
  createMember,
  removeMember,
  reactivateMember,
} from '../controllers/memberController.ts';
import { protect, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(protect, requireRole('admin'));

router.get('/overview', getAdminOverview);
router.get('/', listMembers);
router.post('/', createMember);
router.delete('/:id', removeMember);
router.patch('/:id/reactivate', reactivateMember);

export default router;
