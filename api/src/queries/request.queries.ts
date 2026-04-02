import { prisma } from '../config/prisma.config';
import { HttpMethod } from '../types';

export const createSavedRequest = async (data: {
  name: string;
  collectionId: string;
  method: HttpMethod;
  url: string;
  headers: any;
  params: any;
  body?: string;
  auth?: any;
  order?: number;
}) => {
  return prisma.savedRequest.create({
    data,
  });
};

export const findSavedRequestById = async (id: string) => {
  return prisma.savedRequest.findUnique({
    where: { id },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });
};

export const findSavedRequestWithCollection = async (id: string) => {
  return prisma.savedRequest.findUnique({
    where: { id },
    include: { collection: true },
  });
};

export const findSavedRequestsByCollectionId = async (collectionId: string) => {
  return prisma.savedRequest.findMany({
    where: { collectionId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });
};

export const updateSavedRequest = async (
  id: string,
  data: {
    name?: string;
    method?: HttpMethod;
    url?: string;
    headers?: any;
    params?: any;
    body?: string;
    auth?: any;
    collectionId?: string;
    order?: number;
  }
) => {
  return prisma.savedRequest.update({
    where: { id },
    data,
  });
};

export const deleteSavedRequest = async (id: string) => {
  return prisma.savedRequest.delete({
    where: { id },
  });
};

export const createSharedLink = async (data: {
  savedRequestId: string;
  token: string;
  expiresAt?: Date;
}) => {
  return prisma.sharedLink.create({
    data,
  });
};

export const findSharedLinkByToken = async (token: string) => {
  return prisma.sharedLink.findUnique({
    where: { token },
    include: {
      savedRequest: {
        include: {
          tags: { include: { tag: true } },
        },
      },
    },
  });
};

export const getMaxRequestOrder = async (collectionId: string) => {
  const result = await prisma.savedRequest.aggregate({
    _max: { order: true },
    where: { collectionId },
  });
  return result._max.order ?? 0;
};

export const searchSavedRequests = async (params: {
  workspaceId: string;
  query?: string;
  tags?: string[];
  collectionId?: string;
  method?: HttpMethod;
}) => {
  const { workspaceId, query, tags, collectionId, method } = params;

  return prisma.savedRequest.findMany({
    where: {
      collection: { workspaceId },
      ...(collectionId ? { collectionId } : {}),
      ...(method ? { method } : {}),
      ...(query
        ? {
            OR: [{ name: { contains: query } }, { url: { contains: query } }],
          }
        : {}),
      ...(tags && tags.length > 0
        ? {
            tags: {
              some: {
                tag: {
                  name: { in: tags },
                },
              },
            },
          }
        : {}),
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      collection: {
        select: { id: true, name: true, workspaceId: true },
      },
      tags: { include: { tag: true } },
    },
  });
};

export const replaceRequestTags = async (requestId: string, tagIds: string[]) => {
  const ops = [prisma.requestTag.deleteMany({ where: { requestId } })];
  if (tagIds.length > 0) {
    ops.push(
      prisma.requestTag.createMany({
        data: tagIds.map((tagId) => ({ requestId, tagId })),
      })
    );
  }
  return prisma.$transaction(ops);
};
