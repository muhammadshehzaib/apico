import crypto from 'crypto';
import {
  createCollection,
  findCollectionById,
  findCollectionsByWorkspaceId,
  updateCollection,
  deleteCollection,
  createCollectionShareLink,
  findCollectionShareLinkByToken,
  getMaxCollectionOrder,
  reorderCollectionsQuery,
} from '../queries/collection.queries';
import { findFolderById } from '../queries/folder.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';
import { GoneError, NotFoundError } from '../errors/AppError';

export const createCollectionService = async (
  name: string,
  workspaceId: string,
  userId: string,
  folderId?: string | null
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  if (folderId) {
    const folder = await findFolderById(folderId);
    if (!folder || folder.workspaceId !== workspaceId) {
      throw new NotFoundError('Folder');
    }
  }

  const order = (await getMaxCollectionOrder(workspaceId, folderId ?? null)) + 1;

  return createCollection({
    name,
    workspaceId,
    folderId: folderId ?? null,
    order,
  });
};

export const getCollections = async (workspaceId: string, userId: string) => {
  await requireWorkspaceMember(workspaceId, userId);

  return findCollectionsByWorkspaceId(workspaceId);
};

export const updateCollectionService = async (
  id: string,
  data: { name?: string; folderId?: string | null; order?: number },
  userId: string
) => {
  const collection = await findCollectionById(id);

  if (!collection) {
    throw new NotFoundError('Collection');
  }

  await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);

  if (data.folderId) {
    const folder = await findFolderById(data.folderId);
    if (!folder || folder.workspaceId !== collection.workspaceId) {
      throw new NotFoundError('Folder');
    }
  }

  return updateCollection(id, data);
};

export const reorderCollectionsService = async (
  items: { id: string; order: number; folderId?: string | null }[],
  userId: string
) => {
  for (const item of items) {
    const collection = await findCollectionById(item.id);
    if (!collection) throw new NotFoundError('Collection');
    await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);
    if (item.folderId) {
      const folder = await findFolderById(item.folderId);
      if (!folder || folder.workspaceId !== collection.workspaceId) throw new NotFoundError('Folder');
    }
  }
  return reorderCollectionsQuery(items);
};

export const deleteCollectionService = async (id: string, userId: string) => {
  const collection = await findCollectionById(id);

  if (!collection) {
    throw new NotFoundError('Collection');
  }

  await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);

  return deleteCollection(id);
};

export const shareCollectionService = async (
  collectionId: string,
  userId: string,
  expiresAt?: string
) => {
  const collection = await findCollectionById(collectionId);

  if (!collection) {
    throw new NotFoundError('Collection');
  }

  await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);

  const token = crypto.randomBytes(32).toString('hex');

  return createCollectionShareLink({
    collectionId,
    token,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });
};

export const getSharedCollectionService = async (token: string) => {
  const link = await findCollectionShareLinkByToken(token);

  if (!link) {
    throw new NotFoundError('Shared collection');
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new GoneError('Shared collection link has expired');
  }

  return link.collection;
};
