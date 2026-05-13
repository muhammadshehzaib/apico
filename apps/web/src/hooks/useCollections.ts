'use client';

import { useState, useCallback, useMemo } from 'react';
import { Collection, SavedRequest, Folder, Tag } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';
import { 
  useCollectionsQuery, 
  useCreateCollectionMutation, 
  useUpdateCollectionMutation, 
  useDeleteCollectionMutation,
  useReorderCollectionsMutation,
  useRequestsQuery,
  useSaveRequestMutation,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useReorderRequestsMutation,
  useFoldersQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useTagsQuery,
  useUpdateRequestTagsMutation
} from './queries/useCollections';
import { collectionService } from '@/services/collection.service';
import { folderService } from '@/services/folder.service';

export interface CollectionWithRequests extends Collection {
  requests: SavedRequest[];
  isLoadingRequests: boolean;
}

export function useCollections(workspaceId: string | null) {
  const { data: rawCollections = [], isLoading, error: collectionsError, refetch: fetchCollections } = useCollectionsQuery(workspaceId);
  const { data: folders = [], isLoading: isFoldersLoading, refetch: fetchFolders } = useFoldersQuery(workspaceId);
  const { data: tags = [], isLoading: isTagsLoading, refetch: fetchTags } = useTagsQuery(workspaceId);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Create mutations
  const createCollectionMut = useCreateCollectionMutation();
  const updateCollectionMut = useUpdateCollectionMutation();
  const deleteCollectionMut = useDeleteCollectionMutation();
  const reorderCollectionsMut = useReorderCollectionsMutation();

  const saveRequestMut = useSaveRequestMutation();
  const updateRequestMut = useUpdateRequestMutation();
  const deleteRequestMut = useDeleteRequestMutation();
  const reorderRequestsMut = useReorderRequestsMutation();
  
  const createFolderMut = useCreateFolderMutation();
  const updateFolderMut = useUpdateFolderMutation();
  const deleteFolderMut = useDeleteFolderMutation();

  const updateRequestTagsMut = useUpdateRequestTagsMutation();

  const error = collectionsError ? (collectionsError as Error).message : null;

  // Toggle expand
  const toggleExpand = useCallback(
    async (collectionId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(collectionId)) {
          next.delete(collectionId);
        } else {
          next.add(collectionId);
        }
        return next;
      });
    },
    []
  );

  // Fallback for fetching requests (using standard api directly or relying on component level query)
  // To avoid fetching all requests for all collections at once, we'd normally want a separate hook per collection.
  // For compatibility with the old hook shape, we just map collections.
  const fetchRequests = useCallback(async (collectionId: string) => {
    return collectionService.getSavedRequests(collectionId);
  }, []);

  const collections: CollectionWithRequests[] = useMemo(() => {
    return rawCollections.map(c => ({
      ...c,
      requests: [], // Note: for full migration, components should use useRequestsQuery per collection
      isLoadingRequests: false
    }));
  }, [rawCollections]);

  // Wrappers
  const createCollection = async (name: string, folderId?: string | null) => {
    if (!workspaceId) return;
    const res = await createCollectionMut.mutateAsync({ workspaceId, name, folderId });
    setExpandedIds(prev => new Set([...prev, res.id]));
    return res;
  };

  const renameCollection = async (id: string, name: string) => updateCollectionMut.mutateAsync({ id, data: { name } });
  const moveCollection = async (id: string, folderId: string | null) => updateCollectionMut.mutateAsync({ id, data: { folderId } });
  const deleteCollection = async (id: string) => deleteCollectionMut.mutateAsync(id);
  const reorderCollections = async (items: any[]) => reorderCollectionsMut.mutateAsync(items);

  const saveRequest = async (collectionId: string, data: SaveRequestInput) => saveRequestMut.mutateAsync({ collectionId, data });
  const renameRequest = async (id: string, collectionId: string, name: string) => updateRequestMut.mutateAsync({ id, data: { name, collectionId } });
  const deleteRequest = async (id: string, collectionId: string) => deleteRequestMut.mutateAsync(id);
  const moveRequest = async (id: string, fromCollectionId: string, toCollectionId: string) => updateRequestMut.mutateAsync({ id, data: { collectionId: toCollectionId } });
  const reorderRequests = async (items: any[]) => reorderRequestsMut.mutateAsync(items);

  const createFolder = async (name: string, parentId?: string | null) => {
    if (!workspaceId) return;
    return createFolderMut.mutateAsync({ workspaceId, name, parentId });
  };
  const renameFolder = async (id: string, name: string) => updateFolderMut.mutateAsync({ workspaceId: workspaceId!, id, data: { name } });
  const moveFolder = async (id: string, parentId: string | null) => updateFolderMut.mutateAsync({ workspaceId: workspaceId!, id, data: { parentId } });
  const deleteFolder = async (id: string) => deleteFolderMut.mutateAsync({ workspaceId: workspaceId!, id });
  
  const reorderFolders = async (items: any[]) => {
    if (!workspaceId) return;
    return folderService.reorderFolders(workspaceId, items);
  };

  const updateRequestTags = async (id: string, tagsList: string[]) => updateRequestTagsMut.mutateAsync({ id, tags: tagsList });
  
  const searchRequests = async (params: any) => {
    if (!workspaceId) return [];
    return collectionService.searchRequests({ workspaceId, ...params });
  };

  const shareCollection = async (id: string) => collectionService.shareCollection(id);
  const shareRequest = async (id: string) => collectionService.shareRequest(id);

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
