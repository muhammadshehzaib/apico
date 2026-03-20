import { prisma } from '../config/prisma.config';

export const createEnvironment = async (data: { name: string; workspaceId: string }) => {
  return prisma.environment.create({
    data,
  });
};

export const findEnvironmentById = async (id: string) => {
  return prisma.environment.findUnique({
    where: { id },
  });
};

export const findEnvironmentsByWorkspaceId = async (workspaceId: string) => {
  return prisma.environment.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateEnvironment = async (id: string, data: { name?: string }) => {
  return prisma.environment.update({
    where: { id },
    data,
  });
};

export const deleteEnvironment = async (id: string) => {
  return prisma.environment.delete({
    where: { id },
  });
};

export const createVariable = async (data: {
  environmentId: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret: boolean;
}) => {
  return prisma.environmentVariable.create({
    data,
  });
};

export const findVariablesByEnvironmentId = async (environmentId: string) => {
  return prisma.environmentVariable.findMany({
    where: { environmentId },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateVariable = async (
  id: string,
  data: {
    key?: string;
    value?: string;
    enabled?: boolean;
    isSecret?: boolean;
  }
) => {
  return prisma.environmentVariable.update({
    where: { id },
    data,
  });
};

export const deleteVariable = async (id: string) => {
  return prisma.environmentVariable.delete({
    where: { id },
  });
};

export const deleteAllVariablesByEnvironmentId = async (environmentId: string) => {
  return prisma.environmentVariable.deleteMany({
    where: { environmentId },
  });
};
