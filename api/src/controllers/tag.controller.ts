import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import { createTagSchema, updateTagSchema } from '../validations/tag.validation';
import {
  createTagService,
  deleteTagService,
  getTagsService,
  updateTagService,
} from '../services/tag.service';

export const getTagsController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const tags = await getTagsService(workspaceId, userId);

  success(res, tags, 'Tags fetched successfully');
});

export const createTagController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;
  const body = createTagSchema.parse(req.body);

  const tag = await createTagService(workspaceId, userId, body.name);

  success(res, tag, 'Tag created successfully', 201);
});

export const updateTagController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, id } = req.params;
  const userId = req.user!.id;
  const body = updateTagSchema.parse(req.body);

  const tag = await updateTagService(workspaceId, userId, id, body.name);

  success(res, tag, 'Tag updated successfully');
});

export const deleteTagController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, id } = req.params;
  const userId = req.user!.id;

  await deleteTagService(workspaceId, userId, id);

  success(res, null, 'Tag deleted successfully');
});
