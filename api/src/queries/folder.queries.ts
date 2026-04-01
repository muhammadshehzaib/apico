import { prisma } from '../config/prisma.config';

export const createFolder = async (data: {
  name: string;
  workspaceId: string;
  parentId?: string | null;
  order?: number;
}) => {
  return prisma.folder.create({ data });
};

export const findFolderById = async (id: string) => {
  return prisma.folder.findUnique({
    where: { id },
  });
};

export const findFoldersByWorkspaceId = async (workspaceId: string) => {
  return prisma.folder.findMany({
    where: { workspaceId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

export const updateFolder = async (
  id: string,
  data: { name?: string; parentId?: string | null; order?: number }
) => {
  return prisma.folder.update({
    where: { id },
    data,
  });
};

export const deleteFolder = async (id: string) => {
  return prisma.folder.delete({
    where: { id },
  });
};

export const getMaxFolderOrder = async (workspaceId: string, parentId?: string | null) => {
  const result = await prisma.folder.aggregate({
    _max: { order: true },
    where: { workspaceId, parentId: parentId ?? null },
  });
  return result._max.order ?? 0;
};
