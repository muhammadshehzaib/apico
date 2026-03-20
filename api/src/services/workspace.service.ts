import {
  createWorkspace,
  findWorkspaceById,
  findWorkspacesByUserId,
  addWorkspaceMember,
  findWorkspaceMember,
} from '../queries/workspace.queries';
import { findUserByEmail } from '../queries/user.queries';
import { WorkspaceRole } from '../types';

export const createWorkspaceService = async (name: string, userId: string) => {
  const workspace = await createWorkspace({
    name,
    ownerId: userId,
  });

  await addWorkspaceMember({
    workspaceId: workspace.id,
    userId,
    role: WorkspaceRole.OWNER,
  });

  return workspace;
};

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await findWorkspacesByUserId(userId);
  return memberships.map((m) => m.workspace);
};

export const getWorkspaceById = async (id: string, userId: string) => {
  const member = await findWorkspaceMember(id, userId);

  if (!member) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }

  const workspace = await findWorkspaceById(id);
  return workspace;
};

export const inviteUserToWorkspace = async (
  workspaceId: string,
  inviterId: string,
  email: string,
  role: WorkspaceRole
) => {
  const member = await findWorkspaceMember(workspaceId, inviterId);

  if (!member || member.role !== WorkspaceRole.OWNER) {
    const error = new Error('Only workspace owners can invite members');
    (error as any).statusCode = 403;
    throw error;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const existingMember = await findWorkspaceMember(workspaceId, user.id);

  if (existingMember) {
    const error = new Error('User is already a member of this workspace');
    (error as any).statusCode = 400;
    throw error;
  }

  return addWorkspaceMember({
    workspaceId,
    userId: user.id,
    role,
  });
};
