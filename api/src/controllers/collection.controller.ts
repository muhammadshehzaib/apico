import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createCollectionService,
  getCollections,
  updateCollectionService,
  deleteCollectionService,
} from '../services/collection.service';
import { createCollectionSchema } from '../validations/request.validation';

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const body = createCollectionSchema.parse(req.body);
  const userId = req.user!.id;

  const collection = await createCollectionService(body.name, workspaceId, userId);

  success(res, collection, 'Collection created successfully', 201);
});

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const collections = await getCollections(workspaceId, userId);

  success(res, collections, 'Collections fetched successfully');
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = createCollectionSchema.parse(req.body);
  const userId = req.user!.id;

  const collection = await updateCollectionService(id, body.name, userId);

  success(res, collection, 'Collection updated successfully');
});

export const deleteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteCollectionService(id, userId);

  success(res, null, 'Collection deleted successfully');
});
