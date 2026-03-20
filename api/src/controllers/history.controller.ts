import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import { getHistory, deleteHistoryEntryService, clearHistory } from '../services/history.service';

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  const history = await getHistory(userId, page, limit);

  success(res, history, 'History fetched successfully');
});

export const deleteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteHistoryEntryService(id, userId);

  success(res, null, 'History entry deleted successfully');
});

export const clearController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await clearHistory(userId);

  success(res, null, 'History cleared successfully');
});
