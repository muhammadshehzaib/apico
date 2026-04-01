import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createFolderService,
  deleteFolderService,
  getFoldersService,
  reorderFoldersService,
  updateFolderService,
} from '../services/folder.service';
import {
  createFolderSchema,
  updateFolderSchema,
  reorderFoldersSchema,
} from '../validations/folder.validation';

export const createFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const body = createFolderSchema.parse(req.body);
  const userId = req.user!.id;

  const folder = await createFolderService(
    body.name,
    workspaceId,
    userId,
    body.parentId ?? null
  );

  success(res, folder, 'Folder created successfully', 201);
});

export const getFoldersController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const folders = await getFoldersService(workspaceId, userId);

  success(res, folders, 'Folders fetched successfully');
});

export const updateFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateFolderSchema.parse(req.body);
  const userId = req.user!.id;

  const folder = await updateFolderService(id, body, userId);

  success(res, folder, 'Folder updated successfully');
});

export const deleteFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteFolderService(id, userId);

  success(res, null, 'Folder deleted successfully');
});

export const reorderFoldersController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;
  const body = reorderFoldersSchema.parse(req.body);

  await reorderFoldersService(workspaceId, userId, body.items);

  success(res, null, 'Folders reordered successfully');
});
