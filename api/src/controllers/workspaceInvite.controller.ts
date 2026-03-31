import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  acceptWorkspaceInvite,
  getWorkspaceInvite,
  getUserPendingInvites,
  declineWorkspaceInvite,
} from '../services/workspace.service';

export const getInviteController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const invite = await getWorkspaceInvite(token);

  success(res, {
    id: invite.id,
    status: invite.status,
    role: invite.role,
    expiresAt: invite.expiresAt,
    workspace: invite.workspace
      ? { id: invite.workspace.id, name: invite.workspace.name }
      : null,
    invitedBy: invite.invitedBy
      ? { id: invite.invitedBy.id, name: invite.invitedBy.name, email: invite.invitedBy.email }
      : null,
  });
});

export const acceptInviteController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const userId = req.user!.id;

  const membership = await acceptWorkspaceInvite(token, userId);

  success(res, membership, 'Invite accepted successfully');
});

export const getPendingInvitesController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const invites = await getUserPendingInvites(userId);

  success(res, invites, 'Pending invites fetched successfully');
});

export const declineInviteController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const userId = req.user!.id;

  await declineWorkspaceInvite(token, userId);

  success(res, null, 'Invite declined successfully');
});
