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
} from '../queries/collection.queries';
import { findFolderById } from '../queries/folder.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';

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
      const error = new Error('Folder not found');
      (error as any).statusCode = 404;
      throw error;
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
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);

  if (data.folderId) {
    const folder = await findFolderById(data.folderId);
    if (!folder || folder.workspaceId !== collection.workspaceId) {
      const error = new Error('Folder not found');
      (error as any).statusCode = 404;
      throw error;
    }
  }

  return updateCollection(id, data);
};

export const deleteCollectionService = async (id: string, userId: string) => {
  const collection = await findCollectionById(id);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
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
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
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
    const error = new Error('Shared collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    const error = new Error('Shared collection link has expired');
    (error as any).statusCode = 410;
    throw error;
  }

  return link.collection;
};
