import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createController,
  getAllController,
  getOneController,
  inviteController,
  getMembersController,
  getInvitesController,
  revokeInviteController,
  removeMemberController,
  updateMemberRoleController,
  leaveWorkspaceController,
} from '../controllers/workspace.controller';

const router = Router();

router.use(authenticate);

router.post('/', createController);
router.get('/', getAllController);
router.get('/:id', getOneController);
router.post('/:id/invite', inviteController);
router.get('/:id/members', getMembersController);
router.get('/:id/invites', getInvitesController);
router.post('/:id/invites/:inviteId/revoke', revokeInviteController);
router.delete('/:id/members/:userId', removeMemberController);
router.patch('/:id/members/:userId', updateMemberRoleController);
router.post('/:id/leave', leaveWorkspaceController);

export default router;
