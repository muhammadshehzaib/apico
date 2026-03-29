import { prisma } from '../config/prisma.config';
import { WorkspaceRole } from '../types';

export const createWorkspaceInvite = async (data: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt?: Date | null;
}) => {
  return prisma.workspaceInvite.create({
    data,
  });
};

export const findWorkspaceInviteByToken = async (token: string) => {
  return prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: true,
      invitedBy: true,
      acceptedBy: true,
    },
  });
};

export const findPendingWorkspaceInvite = async (workspaceId: string, email: string) => {
  return prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      email,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateWorkspaceInvite = async (
  id: string,
  data: Partial<{
    status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
    acceptedAt: Date | null;
    acceptedById: string | null;
    expiresAt: Date | null;
  }>
) => {
  return prisma.workspaceInvite.update({
    where: { id },
    data,
  });
};
