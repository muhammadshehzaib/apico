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
import { findWorkspaceMember } from '../queries/workspace.queries';

const verifyWorkspaceAccess = async (workspaceId: string, userId: string) => {
  const member = await findWorkspaceMember(workspaceId, userId);
  if (!member) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }
};

export const createEnvironmentService = async (
  name: string,
  workspaceId: string,
  userId: string
) => {
  await verifyWorkspaceAccess(workspaceId, userId);

  return createEnvironment({
    name,
    workspaceId,
  });
};

export const getEnvironments = async (workspaceId: string, userId: string) => {
  await verifyWorkspaceAccess(workspaceId, userId);

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
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

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
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

  return updateEnvironment(id, { name });
};

export const deleteEnvironmentService = async (id: string, userId: string) => {
  const environment = await findEnvironmentById(id);

  if (!environment) {
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

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
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

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
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

  return updateVariable(id, data);
};

export const deleteVariableService = async (
  id: string,
  environmentId: string,
  userId: string
) => {
  const environment = await findEnvironmentById(environmentId);

  if (!environment) {
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

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
    const error = new Error('Environment not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(environment.workspaceId, userId);

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
