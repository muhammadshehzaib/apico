import crypto from 'crypto';
import {
  createSavedRequest,
  findSavedRequestById,
  findSavedRequestsByCollectionId,
  updateSavedRequest,
  deleteSavedRequest,
  createSharedLink,
  findSharedLinkByToken,
} from '../queries/request.queries';
import { findCollectionById } from '../queries/collection.queries';
import { findWorkspaceMember } from '../queries/workspace.queries';
import { createHistoryEntry } from '../queries/history.queries';
import { executeRequest } from '../proxy/executor';
import { ExecuteRequestPayload, HttpMethod } from '../types';

const verifyCollectionAccess = async (collectionId: string, userId: string) => {
  const collection = await findCollectionById(collectionId);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const member = await findWorkspaceMember(collection.workspaceId, userId);

  if (!member) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }
};

export const executeAndSave = async (payload: ExecuteRequestPayload, userId?: string) => {
  const result = await executeRequest(payload);

  // Only save to history if user is authenticated
  if (userId) {
    await createHistoryEntry({
      userId,
      method: payload.method,
      url: payload.url,
      headers: payload.headers,
      body: payload.body,
      statusCode: result.statusCode,
      response: result.body,
      duration: result.duration,
      size: result.size,
    });
  }

  return result;
};

export const saveRequest = async (
  data: {
    name: string;
    method: HttpMethod;
    url: string;
    headers: any;
    params: any;
    body?: string;
    auth?: any;
  },
  collectionId: string,
  userId: string
) => {
  await verifyCollectionAccess(collectionId, userId);

  return createSavedRequest({
    name: data.name,
    collectionId,
    method: data.method,
    url: data.url,
    headers: data.headers,
    params: data.params,
    body: data.body,
    auth: data.auth,
  });
};

export const getSavedRequests = async (collectionId: string, userId: string) => {
  await verifyCollectionAccess(collectionId, userId);

  return findSavedRequestsByCollectionId(collectionId);
};

export const updateSavedRequestService = async (
  id: string,
  data: {
    name?: string;
    method?: HttpMethod;
    url?: string;
    headers?: any;
    params?: any;
    body?: string;
    auth?: any;
  },
  userId: string
) => {
  const request = await findSavedRequestById(id);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionAccess(request.collectionId, userId);

  return updateSavedRequest(id, data);
};

export const deleteSavedRequestService = async (id: string, userId: string) => {
  const request = await findSavedRequestById(id);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionAccess(request.collectionId, userId);

  return deleteSavedRequest(id);
};

export const createSharedLinkService = async (
  savedRequestId: string,
  userId: string,
  expiresAt?: string
) => {
  const request = await findSavedRequestById(savedRequestId);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionAccess(request.collectionId, userId);

  const token = crypto.randomBytes(32).toString('hex');

  return createSharedLink({
    savedRequestId,
    token,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });
};

export const getSharedLink = async (token: string) => {
  const link = await findSharedLinkByToken(token);

  if (!link) {
    const error = new Error('Shared link not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    const error = new Error('Shared link has expired');
    (error as any).statusCode = 410;
    throw error;
  }

  return link.savedRequest;
};
