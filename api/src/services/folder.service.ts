import {
  createFolder,
  findFolderById,
  findFoldersByWorkspaceId,
  updateFolder,
  deleteFolder,
  getMaxFolderOrder,
} from '../queries/folder.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';

const ensureFolderInWorkspace = async (folderId: string, workspaceId: string) => {
  const folder = await findFolderById(folderId);
  if (!folder || folder.workspaceId !== workspaceId) {
    const error = new Error('Folder not found');
    (error as any).statusCode = 404;
    throw error;
  }
  return folder;
};

export const createFolderService = async (
  name: string,
  workspaceId: string,
  userId: string,
  parentId?: string | null
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  if (parentId) {
    await ensureFolderInWorkspace(parentId, workspaceId);
  }

  const order = (await getMaxFolderOrder(workspaceId, parentId ?? null)) + 1;

  return createFolder({
    name,
    workspaceId,
    parentId: parentId ?? null,
    order,
  });
};

export const getFoldersService = async (workspaceId: string, userId: string) => {
  await requireWorkspaceMember(workspaceId, userId);
  return findFoldersByWorkspaceId(workspaceId);
};

export const updateFolderService = async (
  id: string,
  data: { name?: string; parentId?: string | null; order?: number },
  userId: string
) => {
  const folder = await findFolderById(id);

  if (!folder) {
    const error = new Error('Folder not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await requireWorkspaceRole(folder.workspaceId, userId, WorkspaceRole.EDITOR);

  if (data.parentId) {
    await ensureFolderInWorkspace(data.parentId, folder.workspaceId);
  }

  if (data.parentId === id) {
    const error = new Error('Folder cannot be its own parent');
    (error as any).statusCode = 400;
    throw error;
  }

  return updateFolder(id, data);
};

export const deleteFolderService = async (id: string, userId: string) => {
  const folder = await findFolderById(id);

  if (!folder) {
    const error = new Error('Folder not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await requireWorkspaceRole(folder.workspaceId, userId, WorkspaceRole.EDITOR);

  return deleteFolder(id);
};

export const reorderFoldersService = async (
  workspaceId: string,
  userId: string,
  items: { id: string; order: number; parentId?: string | null }[]
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  for (const item of items) {
    const folder = await ensureFolderInWorkspace(item.id, workspaceId);
    if (item.parentId) {
      await ensureFolderInWorkspace(item.parentId, workspaceId);
    }
    if (item.parentId === folder.id) {
      const error = new Error('Folder cannot be its own parent');
      (error as any).statusCode = 400;
      throw error;
    }
    await updateFolder(folder.id, {
      order: item.order,
      parentId: item.parentId ?? null,
    });
  }
};
