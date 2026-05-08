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
import { prisma } from '../config/prisma.config';
import { AppError, BadRequestError, ForbiddenError, GoneError, NotFoundError } from '../errors/AppError';

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
    throw new ForbiddenError('Only workspace owners can invite members');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMember = await findWorkspaceMember(workspaceId, existingUser.id);
    if (existingMember) {
      throw new BadRequestError('User is already a member of this workspace');
    }
  }

  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  const inviter = await findUserById(inviterId);
  if (!inviter) {
    throw new NotFoundError('Inviter');
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
    throw new NotFoundError('Invite');
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
    throw new NotFoundError('Invite');
  }

  if (invite.status !== 'PENDING') {
    throw new GoneError('Invite is no longer valid');
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    await updateWorkspaceInvite(invite.id, { status: 'EXPIRED' });
    throw new GoneError('Invite has expired');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError('This invite is not for your account');
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
    throw new NotFoundError('Invite');
  }

  if (invite.status !== 'PENDING') {
    throw new BadRequestError('Invite is not pending');
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
    throw new BadRequestError('Cannot remove yourself from workspace');
  }

  const targetMember = await findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    throw new NotFoundError('Member');
  }

  if (targetMember.role === WorkspaceRole.OWNER) {
    throw new BadRequestError('Cannot remove another owner');
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
    throw new BadRequestError('Cannot change your own role');
  }

  const targetMember = await findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    throw new NotFoundError('Member');
  }

  return updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
};

export const getUserPendingInvites = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User');
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
    throw new AppError('You are not a member of this workspace', 404);
  }

  if (member.role === WorkspaceRole.OWNER) {
    throw new BadRequestError('Owners cannot leave their workspace. Transfer ownership first or delete the workspace.');
  }

  await removeWorkspaceMemberQuery(workspaceId, userId);
};

export const declineWorkspaceInvite = async (token: string, userId: string) => {
  const invite = await findWorkspaceInviteByToken(token);

  if (!invite) {
    throw new NotFoundError('Invite');
  }

  if (invite.status !== 'PENDING') {
    throw new GoneError('Invite is no longer valid');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError('This invite is not for your account');
  }

  await updateWorkspaceInvite(invite.id, { status: 'REVOKED' });
};

export const clearWorkspaceDataService = async (workspaceId: string, userId: string) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  return prisma.$transaction(async (tx) => {
    const collectionsResult = await tx.collection.deleteMany({
      where: { workspaceId },
    });

    const foldersResult = await tx.folder.deleteMany({
      where: { workspaceId },
    });

    const tagsResult = await tx.tag.deleteMany({
      where: { workspaceId },
    });

    return {
      collectionsDeleted: collectionsResult.count,
      foldersDeleted: foldersResult.count,
      tagsDeleted: tagsResult.count,
    };
  });
};
