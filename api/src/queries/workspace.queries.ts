import { prisma } from '../config/prisma.config';
import { WorkspaceRole } from '../types';

export const createWorkspace = async (data: { name: string; ownerId: string }) => {
  return prisma.workspace.create({
    data,
  });
};

export const findWorkspaceById = async (id: string) => {
  return prisma.workspace.findUnique({
    where: { id },
  });
};

export const findWorkspacesByUserId = async (userId: string) => {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });
};

export const addWorkspaceMember = async (data: {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}) => {
  return prisma.workspaceMember.create({
    data,
  });
};

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });
};

export const findWorkspaceMembers = async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const removeWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });
};

export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
) => {
  return prisma.workspaceMember.update({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};
