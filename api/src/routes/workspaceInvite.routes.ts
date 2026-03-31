import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  acceptInviteController,
  getInviteController,
  getPendingInvitesController,
  declineInviteController,
} from '../controllers/workspaceInvite.controller';

const router = Router();

// Must be before /:token to avoid "pending" being captured as a token param
router.get('/pending', authenticate, getPendingInvitesController);

router.get('/:token', getInviteController);
router.post('/:token/accept', authenticate, acceptInviteController);
router.post('/:token/decline', authenticate, declineInviteController);

export default router;
