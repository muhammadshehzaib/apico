import {
  createTag,
  findTagsByWorkspaceId,
  updateTag,
  deleteTag,
  findTagById,
} from '../queries/tag.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';
import { NotFoundError } from '../errors/AppError';

export const getTagsService = async (workspaceId: string, userId: string) => {
  await requireWorkspaceMember(workspaceId, userId);
  return findTagsByWorkspaceId(workspaceId);
};

export const createTagService = async (workspaceId: string, userId: string, name: string) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);
  return createTag({ workspaceId, name });
};

export const updateTagService = async (workspaceId: string, userId: string, id: string, name: string) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);
  const tag = await findTagById(id);
  if (!tag || tag.workspaceId !== workspaceId) {
    throw new NotFoundError('Tag');
  }
  return updateTag(id, name);
};

export const deleteTagService = async (workspaceId: string, userId: string, id: string) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);
  const tag = await findTagById(id);
  if (!tag || tag.workspaceId !== workspaceId) {
    throw new NotFoundError('Tag');
  }
  return deleteTag(id);
};
