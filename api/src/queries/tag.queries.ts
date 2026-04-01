import { prisma } from '../config/prisma.config';

export const createTag = async (data: { name: string; workspaceId: string }) => {
  return prisma.tag.create({ data });
};

export const upsertTag = async (workspaceId: string, name: string) => {
  return prisma.tag.upsert({
    where: { workspaceId_name: { workspaceId, name } },
    update: {},
    create: { workspaceId, name },
  });
};

export const findTagsByWorkspaceId = async (workspaceId: string) => {
  return prisma.tag.findMany({
    where: { workspaceId },
    orderBy: [{ name: 'asc' }],
  });
};

export const updateTag = async (id: string, name: string) => {
  return prisma.tag.update({
    where: { id },
    data: { name },
  });
};

export const deleteTag = async (id: string) => {
  return prisma.tag.delete({
    where: { id },
  });
};
