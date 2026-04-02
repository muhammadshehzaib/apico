import crypto from 'crypto';
import {
  createSavedRequest,
  findSavedRequestById,
  findSavedRequestWithCollection,
  findSavedRequestsByCollectionId,
  updateSavedRequest,
  deleteSavedRequest,
  createSharedLink,
  findSharedLinkByToken,
  getMaxRequestOrder,
  searchSavedRequests,
  replaceRequestTags,
} from '../queries/request.queries';
import { findCollectionById } from '../queries/collection.queries';
import { requireWorkspaceMember, requireWorkspaceRole } from '../utils/workspace-access.util';
import { createHistoryEntry } from '../queries/history.queries';
import { executeRequest } from '../proxy/executor';
import { ExecuteRequestPayload, HttpMethod, WorkspaceRole } from '../types';
import { upsertTag } from '../queries/tag.queries';

const verifyCollectionAccess = async (collectionId: string, userId: string) => {
  const collection = await findCollectionById(collectionId);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await requireWorkspaceMember(collection.workspaceId, userId);
};

const verifyCollectionWriteAccess = async (collectionId: string, userId: string) => {
  const collection = await findCollectionById(collectionId);

  if (!collection) {
    const error = new Error('Collection not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await requireWorkspaceRole(collection.workspaceId, userId, WorkspaceRole.EDITOR);
};

export const executeAndSave = async (payload: ExecuteRequestPayload, userId?: string) => {
  const result = await executeRequest(payload);

  // Only save to history if user is authenticated
  if (userId) {
    const historyBody = payload.bodyType === 'form-data' && payload.formDataFields
      ? JSON.stringify({ __bodyType: 'form-data', fields: payload.formDataFields })
      : payload.body;

    await createHistoryEntry({
      userId,
      method: payload.method,
      url: payload.url,
      headers: payload.headers,
      body: historyBody,
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
  await verifyCollectionWriteAccess(collectionId, userId);

  const order = (await getMaxRequestOrder(collectionId)) + 1;

  return createSavedRequest({
    name: data.name,
    collectionId,
    method: data.method,
    url: data.url,
    headers: data.headers,
    params: data.params,
    body: data.body,
    auth: data.auth,
    order,
  });
};

export const getSavedRequests = async (collectionId: string, userId: string) => {
  await verifyCollectionAccess(collectionId, userId);

  const requests = await findSavedRequestsByCollectionId(collectionId);
  return requests.map((request) => ({
    ...request,
    tags: request.tags.map((tagLink) => tagLink.tag),
  }));
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
    collectionId?: string;
    order?: number;
  },
  userId: string
) => {
  const request = await findSavedRequestWithCollection(id);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionWriteAccess(request.collectionId, userId);

  if (data.collectionId && data.collectionId !== request.collectionId) {
    await verifyCollectionWriteAccess(data.collectionId, userId);
    if (data.order === undefined) {
      data.order = (await getMaxRequestOrder(data.collectionId)) + 1;
    }
  }

  await updateSavedRequest(id, data);
  const updated = await findSavedRequestById(id);
  if (!updated) return updated;
  return {
    ...updated,
    tags: updated.tags.map((tagLink) => tagLink.tag),
  };
};

export const deleteSavedRequestService = async (id: string, userId: string) => {
  const request = await findSavedRequestById(id);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionWriteAccess(request.collectionId, userId);

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

  await verifyCollectionWriteAccess(request.collectionId, userId);

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

  return {
    ...link.savedRequest,
    tags: link.savedRequest.tags.map((tagLink) => tagLink.tag),
  };
};

export const searchRequestsService = async (
  params: {
    workspaceId: string;
    query?: string;
    tags?: string[];
    collectionId?: string;
    method?: HttpMethod;
  },
  userId: string
) => {
  await requireWorkspaceMember(params.workspaceId, userId);
  const results = await searchSavedRequests(params);
  return results.map((request) => ({
    ...request,
    tags: request.tags.map((tagLink) => tagLink.tag),
  }));
};

export const updateRequestTagsService = async (
  requestId: string,
  userId: string,
  tags: string[]
) => {
  const request = await findSavedRequestWithCollection(requestId);

  if (!request) {
    const error = new Error('Request not found');
    (error as any).statusCode = 404;
    throw error;
  }

  await verifyCollectionWriteAccess(request.collectionId, userId);

  const normalizedTags = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  );

  const tagIds: string[] = [];
  for (const tagName of normalizedTags) {
    const tag = await upsertTag(request.collection.workspaceId, tagName);
    tagIds.push(tag.id);
  }

  await replaceRequestTags(requestId, tagIds);

  const updated = await findSavedRequestById(requestId);
  if (!updated) return updated;
  return {
    ...updated,
    tags: updated.tags.map((tagLink) => tagLink.tag),
  };
};
