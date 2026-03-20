'use client';

import { useState, useCallback, useEffect } from 'react';
import { Collection, SavedRequest } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';
import { collectionService } from '@/services/collection.service';

export interface CollectionWithRequests extends Collection {
  requests: SavedRequest[];
  isLoadingRequests: boolean;
}

export function useCollections(workspaceId: string | null) {
  const [collections, setCollections] = useState<CollectionWithRequests[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  // Load initial collections when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchCollections(workspaceId);
      setExpandedIds(new Set());
    }
  }, [workspaceId, fetchCollections]);

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
  const createCollection = useCallback(async (name: string) => {
    if (!workspaceId) return;

    try {
      const newCollection = await collectionService.createCollection(workspaceId, name);
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
      await collectionService.updateCollection(id, name);
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

  return {
    collections,
    isLoading,
    error,
    expandedIds,
    fetchCollections,
    toggleExpand,
    fetchRequests,
    createCollection,
    renameCollection,
    deleteCollection,
    saveRequest,
    renameRequest,
    deleteRequest,
  };
}
