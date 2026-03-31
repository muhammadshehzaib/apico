import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createWorkspaceService,
  getUserWorkspaces,
  getWorkspaceById,
  inviteUserToWorkspace,
  getWorkspaceMembers,
  getWorkspacePendingInvites,
  revokeWorkspaceInviteService,
  removeWorkspaceMemberService,
  updateMemberRoleService,
} from '../services/workspace.service';
import { createWorkspaceSchema, inviteSchema, updateMemberRoleSchema } from '../validations/workspace.validation';

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const body = createWorkspaceSchema.parse(req.body);
  const userId = req.user!.id;

  const workspace = await createWorkspaceService(body.name, userId);

  success(res, workspace, 'Workspace created successfully', 201);
});

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const workspaces = await getUserWorkspaces(userId);

  success(res, workspaces, 'Workspaces fetched successfully');
});

export const getOneController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await getWorkspaceById(id, userId);

  success(res, workspace, 'Workspace fetched successfully');
});

export const inviteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = inviteSchema.parse(req.body);
  const userId = req.user!.id;

  const invite = await inviteUserToWorkspace(id, userId, body.email, body.role as any);

  success(res, invite, 'User invited successfully', 201);
});

export const getMembersController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const members = await getWorkspaceMembers(id, userId);

  success(res, members, 'Members fetched successfully');
});

export const getInvitesController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const invites = await getWorkspacePendingInvites(id, userId);

  success(res, invites, 'Pending invites fetched successfully');
});

export const revokeInviteController = asyncHandler(async (req: Request, res: Response) => {
  const { id, inviteId } = req.params;
  const userId = req.user!.id;

  await revokeWorkspaceInviteService(id, inviteId, userId);

  success(res, null, 'Invite revoked successfully');
});

export const removeMemberController = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: targetUserId } = req.params;
  const requesterId = req.user!.id;

  await removeWorkspaceMemberService(id, targetUserId, requesterId);

  success(res, null, 'Member removed successfully');
});

export const updateMemberRoleController = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: targetUserId } = req.params;
  const body = updateMemberRoleSchema.parse(req.body);
  const requesterId = req.user!.id;

  const updatedMember = await updateMemberRoleService(id, targetUserId, requesterId, body.role as any);

  success(res, updatedMember, 'Role updated successfully');
});
