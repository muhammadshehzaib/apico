import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createWorkspaceService,
  getUserWorkspaces,
  getWorkspaceById,
  inviteUserToWorkspace,
} from '../services/workspace.service';
import { createWorkspaceSchema, inviteSchema } from '../validations/workspace.validation';

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

  const member = await inviteUserToWorkspace(id, userId, body.email, body.role as any);

  success(res, member, 'User invited successfully', 201);
});
