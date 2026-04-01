import { prisma } from '../config/prisma.config';

export const createCollection = async (data: {
  name: string;
  workspaceId: string;
  folderId?: string | null;
  order?: number;
}) => {
  return prisma.collection.create({
    data,
  });
};

export const findCollectionById = async (id: string) => {
  return prisma.collection.findUnique({
    where: { id },
  });
};
export const findCollectionsByWorkspaceId = async (workspaceId: string) => {
  return prisma.collection.findMany({
    where: { workspaceId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

export const updateCollection = async (
  id: string,
  data: { name?: string; folderId?: string | null; order?: number }
) => {
  return prisma.collection.update({
    where: { id },
    data,
  });
};

export const deleteCollection = async (id: string) => {
  return prisma.collection.delete({
    where: { id },
  });
};

export const createCollectionShareLink = async (data: {
  collectionId: string;
  token: string;
  expiresAt?: Date;
}) => {
  return prisma.sharedCollectionLink.create({
    data,
  });
};

export const getMaxCollectionOrder = async (workspaceId: string, folderId?: string | null) => {
  const result = await prisma.collection.aggregate({
    _max: { order: true },
    where: { workspaceId, folderId: folderId ?? null },
  });
  return result._max.order ?? 0;
};

export const findCollectionShareLinkByToken = async (token: string) => {
  return prisma.sharedCollectionLink.findUnique({
    where: { token },
    include: {
      collection: {
        include: {
          requests: true,
        },
      },
    },
  });
};
