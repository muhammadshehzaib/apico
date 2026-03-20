import { prisma } from '../config/prisma.config';
import { HttpMethod } from '../types';

export const createHistoryEntry = async (data: {
  userId: string;
  method: HttpMethod;
  url: string;
  headers: any;
  body?: string;
  statusCode?: number;
  response?: string;
  duration?: number;
  size?: number;
}) => {
  return prisma.requestHistory.create({
    data,
  });
};

export const findHistoryByUserId = async (userId: string, limit: number = 50, offset: number = 0) => {
  return prisma.requestHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

export const deleteHistoryEntry = async (id: string) => {
  return prisma.requestHistory.delete({
    where: { id },
  });
};

export const deleteAllHistoryByUserId = async (userId: string) => {
  return prisma.requestHistory.deleteMany({
    where: { userId },
  });
};
