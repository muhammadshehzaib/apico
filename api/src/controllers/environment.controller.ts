import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import {
  createEnvironmentService,
  getEnvironments,
  getEnvironmentById,
  updateEnvironmentService,
  deleteEnvironmentService,
  bulkUpdateVariablesService,
} from '../services/environment.service';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  bulkUpdateVariablesSchema,
} from '../validations/environment.validation';
import { getWorkspaceIdFromRequest } from '../utils/workspace-request.util';

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceIdFromRequest(req);
  if (!workspaceId) {
    const error = new Error('workspaceId is required');
    (error as any).statusCode = 400;
    throw error;
  }
  const body = createEnvironmentSchema.parse(req.body);
  const userId = req.user!.id;

  const environment = await createEnvironmentService(body.name, workspaceId, userId);

  success(res, environment, 'Environment created successfully', 201);
});

export const getAllController = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceIdFromRequest(req);
  if (!workspaceId) {
    const error = new Error('workspaceId is required');
    (error as any).statusCode = 400;
    throw error;
  }
  const userId = req.user!.id;

  const environments = await getEnvironments(workspaceId, userId);

  success(res, environments, 'Environments fetched successfully');
});

export const getOneController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const environment = await getEnvironmentById(id, userId);

  success(res, environment, 'Environment fetched successfully');
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateEnvironmentSchema.parse(req.body);
  const userId = req.user!.id;

  const environment = await updateEnvironmentService(id, body.name, userId);

  success(res, environment, 'Environment updated successfully');
});

export const deleteController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await deleteEnvironmentService(id, userId);

  success(res, null, 'Environment deleted successfully');
});

export const bulkUpdateVariablesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = bulkUpdateVariablesSchema.parse(req.body);
    const userId = req.user!.id;

    const variables = await bulkUpdateVariablesService(id, body.variables, userId);

    success(res, variables, 'Variables updated successfully');
  }
);
