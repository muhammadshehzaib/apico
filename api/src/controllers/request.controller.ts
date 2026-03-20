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
} from '../services/request.service';
import {
  executeRequestSchema,
  saveRequestSchema,
  shareRequestSchema,
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
  const body = saveRequestSchema.partial().parse(req.body);
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
