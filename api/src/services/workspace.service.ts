import {
  createWorkspace,
  findWorkspaceById,
  findWorkspacesByUserId,
  addWorkspaceMember,
  findWorkspaceMember,
  findWorkspaceMembers,
  removeWorkspaceMember as removeWorkspaceMemberQuery,
  updateWorkspaceMemberRole,
} from '../queries/workspace.queries';
import {
  createWorkspaceInvite,
  findPendingWorkspaceInvite,
  findWorkspaceInviteByToken,
  updateWorkspaceInvite,
  findWorkspaceInviteById,
  findWorkspaceInvitesByWorkspaceId,
  findPendingInvitesByEmail,
} from '../queries/workspaceInvite.queries';
import { findUserByEmail, findUserById } from '../queries/user.queries';
import { sendWorkspaceInviteEmail } from '../utils/email.util';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';
import crypto from 'crypto';
import { env } from '../config/env.config';

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
  return memberships.map((m) => {
    const { _count, ...workspace } = m.workspace;
    return {
      ...workspace,
      role: m.role,
      memberCount: _count.members,
    };
  });
};

export const getWorkspaceById = async (id: string, userId: string) => {
  const member = await requireWorkspaceMember(id, userId);

  const workspace = await findWorkspaceById(id);
  return workspace ? { ...workspace, role: member.role } : workspace;
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

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMember = await findWorkspaceMember(workspaceId, existingUser.id);
    if (existingMember) {
      const error = new Error('User is already a member of this workspace');
      (error as any).statusCode = 400;
      throw error;
    }
  }

  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    const error = new Error('Workspace not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const inviter = await findUserById(inviterId);
  if (!inviter) {
    const error = new Error('Inviter not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const existingInvite = await findPendingWorkspaceInvite(workspaceId, normalizedEmail);
  const isExpired = existingInvite?.expiresAt ? new Date() > existingInvite.expiresAt : false;

  let invite = existingInvite;
  if (invite && isExpired) {
    await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    invite = null;
  }

  if (!invite) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invite = await createWorkspaceInvite({
      workspaceId,
      email: normalizedEmail,
      role: role || WorkspaceRole.VIEWER,
      token,
      invitedById: inviterId,
      expiresAt,
    });
  } else {
    const refreshedExpiresAt = new Date();
    refreshedExpiresAt.setDate(refreshedExpiresAt.getDate() + 7);
    invite = await updateWorkspaceInvite(invite.id, {
      role: role || invite.role,
      expiresAt: refreshedExpiresAt,
    });
  }

  const inviteLink = `${env.WEB_APP_URL}/invite/${invite.token}`;
  try {
    await sendWorkspaceInviteEmail({
      to: normalizedEmail,
      inviterName: inviter.name,
      workspaceName: workspace.name,
      inviteLink,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.warn('[Invite] Failed to send email, returning invite link only', err);
  }

  return {
    invite,
    inviteLink,
  };
};

export const getWorkspaceInvite = async (token: string) => {
  const invite = await findWorkspaceInviteByToken(token);

  if (!invite) {
    const error = new Error('Invite not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (invite.status === 'PENDING' && invite.expiresAt && new Date() > invite.expiresAt) {
    await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    invite.status = 'EXPIRED';
  }

  return invite;
};

export const acceptWorkspaceInvite = async (token: string, userId: string) => {
  const invite = await findWorkspaceInviteByToken(token);

  if (!invite) {
    const error = new Error('Invite not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (invite.status !== 'PENDING') {
    const error = new Error('Invite is no longer valid');
    (error as any).statusCode = 410;
    throw error;
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    const error = new Error('Invite has expired');
    (error as any).statusCode = 410;
    throw error;
  }

  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    const error = new Error('This invite is not for your account');
    (error as any).statusCode = 403;
    throw error;
  }

  const existingMember = await findWorkspaceMember(invite.workspaceId, userId);

  const member =
    existingMember ||
    (await addWorkspaceMember({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
    }));

  await updateWorkspaceInvite(invite.id, {
    status: 'ACCEPTED',
    acceptedAt: new Date(),
    acceptedById: userId,
  });

  return member;
};

export const getWorkspaceMembers = async (workspaceId: string, userId: string) => {
  await requireWorkspaceMember(workspaceId, userId);
  return findWorkspaceMembers(workspaceId);
};

export const getWorkspacePendingInvites = async (workspaceId: string, userId: string) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.OWNER);

  const invites = await findWorkspaceInvitesByWorkspaceId(workspaceId);

  const now = new Date();
  const validInvites = [];
  for (const invite of invites) {
    if (invite.expiresAt && now > invite.expiresAt) {
      await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    } else {
      validInvites.push(invite);
    }
  }

  return validInvites;
};

export const revokeWorkspaceInviteService = async (
  workspaceId: string,
  inviteId: string,
  userId: string
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.OWNER);

  const invite = await findWorkspaceInviteById(inviteId);
  if (!invite || invite.workspaceId !== workspaceId) {
    const error = new Error('Invite not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (invite.status !== 'PENDING') {
    const error = new Error('Invite is not pending');
    (error as any).statusCode = 400;
    throw error;
  }

  await updateWorkspaceInvite(inviteId, { status: 'REVOKED' });
};

export const removeWorkspaceMemberService = async (
  workspaceId: string,
  targetUserId: string,
  requesterId: string
) => {
  await requireWorkspaceRole(workspaceId, requesterId, WorkspaceRole.OWNER);

  if (targetUserId === requesterId) {
    const error = new Error('Cannot remove yourself from workspace');
    (error as any).statusCode = 400;
    throw error;
  }

  const targetMember = await findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    const error = new Error('Member not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (targetMember.role === WorkspaceRole.OWNER) {
    const error = new Error('Cannot remove another owner');
    (error as any).statusCode = 400;
    throw error;
  }

  await removeWorkspaceMemberQuery(workspaceId, targetUserId);
};

export const updateMemberRoleService = async (
  workspaceId: string,
  targetUserId: string,
  requesterId: string,
  newRole: WorkspaceRole
) => {
  await requireWorkspaceRole(workspaceId, requesterId, WorkspaceRole.OWNER);

  if (targetUserId === requesterId) {
    const error = new Error('Cannot change your own role');
    (error as any).statusCode = 400;
    throw error;
  }

  const targetMember = await findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    const error = new Error('Member not found');
    (error as any).statusCode = 404;
    throw error;
  }

  return updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
};

export const getUserPendingInvites = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const invites = await findPendingInvitesByEmail(user.email.toLowerCase());

  const now = new Date();
  const validInvites = [];
  for (const invite of invites) {
    if (invite.expiresAt && now > invite.expiresAt) {
      await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    } else {
      validInvites.push(invite);
    }
  }

  return validInvites;
};

export const leaveWorkspaceService = async (workspaceId: string, userId: string) => {
  const member = await findWorkspaceMember(workspaceId, userId);
  if (!member) {
    const error = new Error('You are not a member of this workspace');
    (error as any).statusCode = 404;
    throw error;
  }

  if (member.role === WorkspaceRole.OWNER) {
    const error = new Error('Owners cannot leave their workspace. Transfer ownership first or delete the workspace.');
    (error as any).statusCode = 400;
    throw error;
  }

  await removeWorkspaceMemberQuery(workspaceId, userId);
};

export const declineWorkspaceInvite = async (token: string, userId: string) => {
  const invite = await findWorkspaceInviteByToken(token);

  if (!invite) {
    const error = new Error('Invite not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (invite.status !== 'PENDING') {
    const error = new Error('Invite is no longer valid');
    (error as any).statusCode = 410;
    throw error;
  }

  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    const error = new Error('This invite is not for your account');
    (error as any).statusCode = 403;
    throw error;
  }

  await updateWorkspaceInvite(invite.id, { status: 'REVOKED' });
};
