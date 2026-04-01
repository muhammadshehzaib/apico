'use client';

import { useState, useCallback, useEffect } from 'react';
import { Collection, SavedRequest, Folder, Tag } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';
import { collectionService } from '@/services/collection.service';
import { folderService } from '@/services/folder.service';
import { tagService } from '@/services/tag.service';

export interface CollectionWithRequests extends Collection {
  requests: SavedRequest[];
  isLoadingRequests: boolean;
}

export function useCollections(workspaceId: string | null) {
  const [collections, setCollections] = useState<CollectionWithRequests[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Fetch collections for workspace
  const fetchCollections = useCallback(async (wsId: string) => {
    if (!wsId) return;
    setIsLoading(true);
    try {
      const data = await collectionService.getCollections(wsId);
      setCollections(
        data.map((c) => ({
          ...c,
          requests: [],
          isLoadingRequests: false,
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFolders = useCallback(async (wsId: string) => {
    if (!wsId) return;
    setIsFoldersLoading(true);
    try {
      const data = await folderService.getFolders(wsId);
      setFolders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
    } finally {
      setIsFoldersLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async (wsId: string) => {
    if (!wsId) return;
    setIsTagsLoading(true);
    try {
      const data = await tagService.getTags(wsId);
      setTags(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setIsTagsLoading(false);
    }
  }, []);

  // Load initial collections when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchCollections(workspaceId);
      fetchFolders(workspaceId);
      fetchTags(workspaceId);
      setExpandedIds(new Set());
    }
  }, [workspaceId, fetchCollections, fetchFolders, fetchTags]);

  // Toggle expand and lazy load requests
  const toggleExpand = useCallback(
    async (collectionId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(collectionId)) {
          next.delete(collectionId);
        } else {
          next.add(collectionId);
          // Fetch requests for this collection
          fetchRequests(collectionId);
        }
        return next;
      });
    },
    []
  );

  // Fetch requests for a collection
  const fetchRequests = useCallback(async (collectionId: string) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId ? { ...c, isLoadingRequests: true } : c
      )
    );

    try {
      const requests = await collectionService.getSavedRequests(collectionId);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, requests, isLoadingRequests: false }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, isLoadingRequests: false } : c
        )
      );
    }
  }, []);

  // Create collection
  const createCollection = useCallback(async (name: string, folderId?: string | null) => {
    if (!workspaceId) return;

    try {
      const newCollection = await collectionService.createCollection(
        workspaceId,
        name,
        folderId ?? null
      );
      const collectionWithRequests: CollectionWithRequests = {
        ...newCollection,
        requests: [],
        isLoadingRequests: false,
      };

      setCollections((prev) => [collectionWithRequests, ...prev]);
      setExpandedIds((prev) => new Set([...prev, newCollection.id]));
      setError(null);

      return newCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
      throw err;
    }
  }, [workspaceId]);

  // Rename collection
  const renameCollection = useCallback(async (id: string, name: string) => {
    try {
      await collectionService.updateCollection(id, { name });
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c))
      );
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename collection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete collection
  const deleteCollection = useCallback(async (id: string) => {
    try {
      await collectionService.deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const moveCollection = useCallback(async (id: string, folderId: string | null) => {
    try {
      await collectionService.updateCollection(id, { folderId });
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, folderId } : c))
      );
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move collection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const reorderCollections = useCallback(
    async (items: { id: string; order: number; folderId?: string | null }[]) => {
      try {
        await collectionService.reorderCollections(items);
        setCollections((prev) =>
          prev.map((c) => {
            const item = items.find((i) => i.id === c.id);
            return item
              ? { ...c, order: item.order, folderId: item.folderId ?? c.folderId }
              : c;
          })
        );
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reorder collections';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Save request
  const saveRequest = useCallback(
    async (collectionId: string, data: SaveRequestInput) => {
      try {
        const newRequest = await collectionService.saveRequest(collectionId, data);

        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, requests: [newRequest, ...c.requests] }
              : c
          )
        );

        setError(null);
        return newRequest;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save request';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Rename request
  const renameRequest = useCallback(
    async (id: string, collectionId: string, name: string) => {
      try {
        await collectionService.updateSavedRequest(id, { name });

        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === id ? { ...r, name } : r
                  ),
                }
              : c
          )
        );

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to rename request';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Delete request
  const deleteRequest = useCallback(async (id: string, collectionId: string) => {
    try {
      await collectionService.deleteSavedRequest(id);

      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                requests: c.requests.filter((r) => r.id !== id),
              }
            : c
        )
      );

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete request';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const moveRequest = useCallback(
    async (id: string, fromCollectionId: string, toCollectionId: string) => {
      try {
        const updated = await collectionService.updateSavedRequest(id, {
          collectionId: toCollectionId,
        });
        setCollections((prev) =>
          prev.map((c) => {
            if (c.id === fromCollectionId) {
              return { ...c, requests: c.requests.filter((r) => r.id !== id) };
            }
            if (c.id === toCollectionId) {
              return { ...c, requests: [updated, ...c.requests] };
            }
            return c;
          })
        );
        setError(null);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to move request';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const createFolder = useCallback(
    async (name: string, parentId?: string | null) => {
      if (!workspaceId) return;
      try {
        const folder = await folderService.createFolder(workspaceId, name, parentId ?? null);
        setFolders((prev) => [folder, ...prev]);
        setError(null);
        return folder;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      if (!workspaceId) return;
      try {
        const updated = await folderService.updateFolder(workspaceId, id, { name });
        setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to rename folder';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const moveFolder = useCallback(
    async (id: string, parentId: string | null) => {
      if (!workspaceId) return;
      try {
        const updated = await folderService.updateFolder(workspaceId, id, { parentId });
        setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to move folder';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      try {
        await folderService.deleteFolder(workspaceId, id);
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setCollections((prev) => prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const reorderFolders = useCallback(
    async (items: { id: string; order: number; parentId?: string | null }[]) => {
      if (!workspaceId) return;
      try {
        await folderService.reorderFolders(workspaceId, items);
        setFolders((prev) =>
          prev.map((f) => {
            const item = items.find((i) => i.id === f.id);
            return item
              ? { ...f, order: item.order, parentId: item.parentId ?? f.parentId }
              : f;
          })
        );
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reorder folders';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const updateRequestTags = useCallback(async (id: string, tagsList: string[]) => {
    try {
      const updated = await collectionService.updateRequestTags(id, tagsList);
      setCollections((prev) =>
        prev.map((c) => ({
          ...c,
          requests: c.requests.map((r) => (r.id === id ? { ...r, tags: updated.tags } : r)),
        }))
      );
      if (updated.tags) {
        setTags((prev) => {
          const map = new Map(prev.map((tag) => [tag.id, tag]));
          for (const tag of updated.tags || []) {
            map.set(tag.id, tag);
          }
          return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tags';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const searchRequests = useCallback(
    async (params: {
      q?: string;
      tags?: string[];
      collectionId?: string;
      method?: string;
    }) => {
      if (!workspaceId) return [];
      try {
        const results = await collectionService.searchRequests({
          workspaceId,
          ...params,
        });
        setError(null);
        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search requests';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const reorderRequests = useCallback(
    async (items: { id: string; order: number; collectionId?: string }[]) => {
      try {
        await collectionService.reorderRequests(items);
        setCollections((prev) =>
          prev.map((c) => ({
            ...c,
            requests: c.requests.map((r) => {
              const item = items.find((i) => i.id === r.id);
              return item ? { ...r, order: item.order } : r;
            }),
          }))
        );
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reorder requests';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const shareCollection = useCallback(async (id: string) => {
    return collectionService.shareCollection(id);
  }, []);

  const shareRequest = useCallback(async (id: string) => {
    return collectionService.shareRequest(id);
  }, []);

  return {
    collections,
    isLoading,
    isFoldersLoading,
    isTagsLoading,
    error,
    expandedIds,
    folders,
    tags,
    fetchCollections,
    fetchFolders,
    fetchTags,
    toggleExpand,
    fetchRequests,
    createCollection,
    renameCollection,
    deleteCollection,
    moveCollection,
    reorderCollections,
    saveRequest,
    renameRequest,
    deleteRequest,
    moveRequest,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    reorderFolders,
    updateRequestTags,
    searchRequests,
    reorderRequests,
    shareCollection,
    shareRequest,
  };
}
