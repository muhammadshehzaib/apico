import {
  createCollection,
  findCollectionById,
  findCollectionsByWorkspaceId,
  updateCollection,
  deleteCollection,
} from '../queries/collection.queries';
import { findWorkspaceMember } from '../queries/workspace.queries';

const verifyWorkspaceAccess = async (workspaceId: string, userId: string) => {
  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }
};

export const createCollectionService = async (
  name: string,
  workspaceId: string,
  userId: string
) => {
  await verifyWorkspaceAccess(workspaceId, userId);

  return createCollection({
    name,
    workspaceId,
  });
};

export const getCollections = async (workspaceId: string, userId: string) => {
  await verifyWorkspaceAccess(workspaceId, userId);

  return findCollectionsByWorkspaceId(workspaceId);
};

export const updateCollectionService = async (id: string, name: string, userId: string) => {
  const collection = await findCollectionById(id);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(collection.workspaceId, userId);

  return updateCollection(id, { name });
};

export const deleteCollectionService = async (id: string, userId: string) => {
  const collection = await findCollectionById(id);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyWorkspaceAccess(collection.workspaceId, userId);

  return deleteCollection(id);
};
