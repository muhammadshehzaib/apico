import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  acceptInviteController,
  getInviteController,
} from '../controllers/workspaceInvite.controller';

const router = Router();

router.get('/:token', getInviteController);
router.post('/:token/accept', authenticate, acceptInviteController);

export default router;
