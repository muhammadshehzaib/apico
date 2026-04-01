import { prisma } from '../config/prisma.config';
import { ImportApicoInput } from '../validations/import.validation';
import { requireWorkspaceRole } from '../utils/workspace-access.util';
import { WorkspaceRole } from '../types';
import { upsertTag } from '../queries/tag.queries';

type IdMap = Map<string, string>;

const buildTagMaps = async (workspaceId: string, payload: ImportApicoInput) => {
  const tagNames = new Set<string>();
  const tagIdMap: IdMap = new Map();
  const tagNameMap: IdMap = new Map();

  for (const tag of payload.tags || []) {
    tagNames.add(tag.name);
    if (tag.id) {
      tagIdMap.set(tag.id, '');
    }
  }

  for (const request of payload.requests || []) {
    for (const tag of request.tags || []) {
      tagNames.add(tag.name);
      if (tag.id) {
        tagIdMap.set(tag.id, '');
      }
    }
  }

  for (const name of tagNames) {
    const created = await upsertTag(workspaceId, name);
    tagNameMap.set(name, created.id);
  }

  for (const [oldId] of tagIdMap.entries()) {
    const tag = (payload.tags || []).find((t) => t.id === oldId) ||
      (payload.requests || []).flatMap((r) => r.tags || []).find((t) => t.id === oldId);
    if (tag && tagNameMap.has(tag.name)) {
      tagIdMap.set(oldId, tagNameMap.get(tag.name)!);
    }
  }

  return { tagIdMap, tagNameMap };
};

export const importApicoService = async (
  workspaceId: string,
  userId: string,
  payload: ImportApicoInput
) => {
  await requireWorkspaceRole(workspaceId, userId, WorkspaceRole.EDITOR);

  const folders = payload.folders || [];
  const collections = payload.collections || [];
  const requests = payload.requests || [];

  const folderIdMap: IdMap = new Map();
  const collectionIdMap: IdMap = new Map();

  const { tagIdMap, tagNameMap } = await buildTagMaps(workspaceId, payload);

  const sortedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const remaining = new Set(sortedFolders.map((f) => f.id || f.name));
  let guard = 0;
  while (remaining.size > 0 && guard < sortedFolders.length + 5) {
    guard += 1;
    for (const folder of sortedFolders) {
      const key = folder.id || folder.name;
      if (!remaining.has(key)) continue;

      const parentId = folder.parentId ? folderIdMap.get(folder.parentId) : null;
      if (folder.parentId && !parentId) {
        continue;
      }

      const created = await prisma.folder.create({
        data: {
          name: folder.name,
          workspaceId,
          parentId: parentId ?? null,
          order: folder.order ?? 0,
        },
      });
      if (folder.id) {
        folderIdMap.set(folder.id, created.id);
      }
      remaining.delete(key);
    }
  }

  if (remaining.size > 0) {
    const error = new Error('Folder hierarchy has invalid parent references');
    (error as any).statusCode = 400;
    throw error;
  }

  const sortedCollections = [...collections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const collection of sortedCollections) {
    const mappedFolderId = collection.folderId ? folderIdMap.get(collection.folderId) : null;
    const created = await prisma.collection.create({
      data: {
        name: collection.name,
        workspaceId,
        folderId: mappedFolderId ?? null,
        order: collection.order ?? 0,
      },
    });
    if (collection.id) {
      collectionIdMap.set(collection.id, created.id);
    }
  }

  const sortedRequests = [...requests].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const request of sortedRequests) {
    const mappedCollectionId = collectionIdMap.get(request.collectionId);
    if (!mappedCollectionId) {
      const error = new Error('Request references an unknown collection');
      (error as any).statusCode = 400;
      throw error;
    }

    const created = await prisma.savedRequest.create({
      data: {
        name: request.name,
        collectionId: mappedCollectionId,
        method: request.method,
        url: request.url,
        headers: request.headers ?? [],
        params: request.params ?? [],
        body: request.body,
        auth: request.auth,
        order: request.order ?? 0,
      },
    });

    const tagIds: string[] = [];
    for (const tag of request.tags || []) {
      if (tag.id && tagIdMap.get(tag.id)) {
        tagIds.push(tagIdMap.get(tag.id)!);
      } else if (tagNameMap.has(tag.name)) {
        tagIds.push(tagNameMap.get(tag.name)!);
      }
    }

    if (tagIds.length > 0) {
      await prisma.requestTag.createMany({
        data: tagIds.map((tagId) => ({ requestId: created.id, tagId })),
        skipDuplicates: true,
      });
    }
  }

  return {
    foldersImported: folders.length,
    collectionsImported: collections.length,
    requestsImported: requests.length,
    tagsImported: tagNameMap.size,
  };
};
