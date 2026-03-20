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
}) => {
  return prisma.savedRequest.create({
    data,
  });
};

export const findSavedRequestById = async (id: string) => {
  return prisma.savedRequest.findUnique({
    where: { id },
  });
};

export const findSavedRequestsByCollectionId = async (collectionId: string) => {
  return prisma.savedRequest.findMany({
    where: { collectionId },
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
      savedRequest: true,
    },
  });
};
