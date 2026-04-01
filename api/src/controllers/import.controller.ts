import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import { importApicoSchema } from '../validations/import.validation';
import { importApicoService } from '../services/import.service';

export const importApicoController = asyncHandler(async (req: Request, res: Response) => {
  const { id: workspaceId } = req.params;
  const userId = req.user!.id;
  const body = importApicoSchema.parse(req.body);

  const result = await importApicoService(workspaceId, userId, body);

  success(res, result, 'Import completed successfully', 201);
});
