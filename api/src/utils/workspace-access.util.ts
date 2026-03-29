import { findWorkspaceMember } from '../queries/workspace.queries';
import { WorkspaceRole } from '../types';

const ROLE_ORDER: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 3,
  [WorkspaceRole.EDITOR]: 2,
  [WorkspaceRole.VIEWER]: 1,
};

export const requireWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await findWorkspaceMember(workspaceId, userId);
  if (!member) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }
  return member;
};

export const requireWorkspaceRole = async (
  workspaceId: string,
  userId: string,
  minRole: WorkspaceRole
) => {
  const member = await requireWorkspaceMember(workspaceId, userId);
  if (ROLE_ORDER[member.role] < ROLE_ORDER[minRole]) {
    const error = new Error('Insufficient permissions');
    (error as any).statusCode = 403;
    throw error;
  }
  return member;
};
