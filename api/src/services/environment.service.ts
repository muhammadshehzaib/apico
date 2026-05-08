import {
  createEnvironment,
  findEnvironmentById,
  findEnvironmentsByWorkspaceId,
  updateEnvironment,
  deleteEnvironment,
  createVariable,
  findVariablesByEnvironmentId,
  updateVariable,
  deleteVariable,
  deleteAllVariablesByEnvironmentId,
} from '../queries/environment.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';
import { NotFoundError } from '../errors/AppError';

export const createEnvironmentService = async (
  name: string,
  workspaceId: string,
  userId: string
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  return createEnvironment({
    name,
    workspaceId,
  });
};

export const getEnvironments = async (workspaceId: string, userId: string) => {
  await requireWorkspaceMember(workspaceId, userId);

  const environments = await findEnvironmentsByWorkspaceId(workspaceId);

  return Promise.all(
    environments.map(async (env) => ({
      ...env,
      variables: await findVariablesByEnvironmentId(env.id),
    }))
  );
};

export const getEnvironmentById = async (id: string, userId: string) => {
  const environment = await findEnvironmentById(id);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceMember(environment.workspaceId, userId);

  const variables = await findVariablesByEnvironmentId(id);

  return {
    ...environment,
    variables,
  };
};

export const updateEnvironmentService = async (
  id: string,
  name: string,
  userId: string
) => {
  const environment = await findEnvironmentById(id);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  return updateEnvironment(id, { name });
};

export const deleteEnvironmentService = async (id: string, userId: string) => {
  const environment = await findEnvironmentById(id);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  await deleteAllVariablesByEnvironmentId(id);
  return deleteEnvironment(id);
};

export const createVariableService = async (
  environmentId: string,
  data: {
    key: string;
    value: string;
    enabled: boolean;
    isSecret: boolean;
  },
  userId: string
) => {
  const environment = await findEnvironmentById(environmentId);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  return createVariable({
    environmentId,
    ...data,
  });
};

export const updateVariableService = async (
  id: string,
  environmentId: string,
  data: {
    key?: string;
    value?: string;
    enabled?: boolean;
    isSecret?: boolean;
  },
  userId: string
) => {
  const environment = await findEnvironmentById(environmentId);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  return updateVariable(id, data);
};

export const deleteVariableService = async (
  id: string,
  environmentId: string,
  userId: string
) => {
  const environment = await findEnvironmentById(environmentId);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  return deleteVariable(id);
};

export const bulkUpdateVariablesService = async (
  environmentId: string,
  variables: Array<{
    key: string;
    value: string;
    enabled: boolean;
    isSecret: boolean;
  }>,
  userId: string
) => {
  const environment = await findEnvironmentById(environmentId);

  if (!environment) {
    throw new NotFoundError('Environment');
  }

  await requireWorkspaceRole(environment.workspaceId, userId, WorkspaceRole.EDITOR);

  await deleteAllVariablesByEnvironmentId(environmentId);

  return Promise.all(
    variables.map((variable) =>
      createVariable({
        environmentId,
        ...variable,
      })
    )
  );
};
