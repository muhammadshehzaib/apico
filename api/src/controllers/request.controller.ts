import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  executeAndSave,
  saveRequest,
  getSavedRequests,
  updateSavedRequestService,
  deleteSavedRequestService,
  createSharedLinkService,
  getSharedLink,
  searchRequestsService,
  updateRequestTagsService,
} from '../services/request.service';
import {
  executeRequestSchema,
  saveRequestSchema,
  shareRequestSchema,
  updateSavedRequestSchema,
  updateRequestTagsSchema,
  reorderRequestsSchema,
} from '../validations/request.validation';

export const executeController = asyncHandler(async (req: Request, res: Response) => {
  const body = executeRequestSchema.parse(req.body);
  const userId = req.user?.id;

  const result = await executeAndSave(body, userId);

  success(res, result, 'Request executed successfully');
});

export const saveController = asyncHandler(async (req: Request, res: Response) => {
  const { collectionId } = req.params;
  const body = saveRequestSchema.parse(req.body);
  const userId = req.user!.id;

  const request = await saveRequest(body, collectionId, userId);

  success(res, request, 'Request saved successfully', 201);
});

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const { collectionId } = req.params;
  const userId = req.user!.id;

  const requests = await getSavedRequests(collectionId, userId);

  success(res, requests, 'Requests fetched successfully');
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateSavedRequestSchema.parse(req.body);
  const userId = req.user!.id;

  const request = await updateSavedRequestService(id, body, userId);

  success(res, request, 'Request updated successfully');
});

export const deleteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteSavedRequestService(id, userId);

  success(res, null, 'Request deleted successfully');
});

export const shareController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = shareRequestSchema.parse(req.body);
  const userId = req.user!.id;

  const link = await createSharedLinkService(id, userId, body.expiresAt);

  success(res, link, 'Shared link created successfully', 201);
});

export const getSharedController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const request = await getSharedLink(token);

  success(res, request, 'Shared request fetched successfully');
});

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { workspaceId, q, tags, collectionId, method } = req.query;

  const workspaceIdStr = String(workspaceId || '');
  if (!workspaceIdStr) {
    const error = new Error('workspaceId is required');
    (error as any).statusCode = 400;
    throw error;
  }

  const tagList =
    typeof tags === 'string'
      ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

  const results = await searchRequestsService(
    {
      workspaceId: workspaceIdStr,
      query: typeof q === 'string' ? q : undefined,
      tags: tagList.length > 0 ? tagList : undefined,
      collectionId: typeof collectionId === 'string' ? collectionId : undefined,
      method: typeof method === 'string' ? (method as any) : undefined,
    },
    userId
  );

  success(res, results, 'Search results fetched successfully');
});

export const updateTagsController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const body = updateRequestTagsSchema.parse(req.body);

  const request = await updateRequestTagsService(id, userId, body.tags);

  success(res, request, 'Request tags updated successfully');
});

export const reorderRequestsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = reorderRequestsSchema.parse(req.body);

  for (const item of body.items) {
    await updateSavedRequestService(
      item.id,
      {
        order: item.order,
        collectionId: item.collectionId,
      },
      userId
    );
  }

  success(res, null, 'Requests reordered successfully');
});
