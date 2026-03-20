import { prisma } from '../config/prisma.config';

export const createCollection = async (data: { name: string; workspaceId: string }) => {
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
  });
};

export const updateCollection = async (id: string, data: { name?: string }) => {
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
