import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createCollectionService,
  getCollections,
  updateCollectionService,
  deleteCollectionService,
  shareCollectionService,
  getSharedCollectionService,
  reorderCollectionsService,
} from '../services/collection.service';
import {
  createCollectionSchema,
  updateCollectionSchema,
  shareCollectionSchema,
  reorderCollectionsSchema,
} from '../validations/request.validation';
import { getWorkspaceIdFromRequest } from '../utils/workspace-request.util';
import { BadRequestError } from '../errors/AppError';

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceIdFromRequest(req);
  if (!workspaceId) {
    throw new BadRequestError('workspaceId is required');
  }
  const body = createCollectionSchema.parse(req.body);
  const userId = req.user!.id;

  const collection = await createCollectionService(
    body.name,
    workspaceId,
    userId,
    body.folderId ?? null
  );

  success(res, collection, 'Collection created successfully', 201);
});

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceIdFromRequest(req);
  if (!workspaceId) {
    throw new BadRequestError('workspaceId is required');
  }
  const userId = req.user!.id;

  const collections = await getCollections(workspaceId, userId);

  success(res, collections, 'Collections fetched successfully');
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateCollectionSchema.parse(req.body);
  const userId = req.user!.id;

  const collection = await updateCollectionService(id, body, userId);

  success(res, collection, 'Collection updated successfully');
});

export const deleteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteCollectionService(id, userId);

  success(res, null, 'Collection deleted successfully');
});

export const shareCollectionController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = shareCollectionSchema.parse(req.body);
  const userId = req.user!.id;

  const link = await shareCollectionService(id, userId, body.expiresAt);

  success(res, link, 'Collection shared successfully', 201);
});

export const getSharedCollectionController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const collection = await getSharedCollectionService(token);

  success(res, collection, 'Shared collection fetched successfully');
});

export const reorderCollectionsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = reorderCollectionsSchema.parse(req.body);
  await reorderCollectionsService(body.items, userId);
  success(res, null, 'Collections reordered successfully');
});
