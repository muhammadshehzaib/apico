'use client';

import { useState, useCallback } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Collection, SavedRequest, Folder, Tag } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';
import { 
  useCollectionsQuery, 
  useCreateCollectionMutation, 
  useUpdateCollectionMutation, 
  useDeleteCollectionMutation,
  useReorderCollectionsMutation,
  collectionKeys,
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
  requestsError?: boolean;
}

export function useCollections(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const { data: rawCollections = [], isLoading, error: collectionsError, refetch: refetchCollections } = useCollectionsQuery(workspaceId);
  const { data: folders = [], isLoading: isFoldersLoading, refetch: fetchFolders } = useFoldersQuery(workspaceId);
  const { data: tags = [], isLoading: isTagsLoading, refetch: fetchTags } = useTagsQuery(workspaceId);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const requestQueries = useQueries({
    queries: rawCollections.map((collection) => ({
      queryKey: collectionKeys.requests(collection.id),
      queryFn: () => collectionService.getSavedRequests(collection.id),
      enabled: expandedIds.has(collection.id),
    })),
  });
  
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

  const fetchRequests = useCallback(async (collectionId: string) => {
    return queryClient.fetchQuery({
      queryKey: collectionKeys.requests(collectionId),
      queryFn: () => collectionService.getSavedRequests(collectionId),
      staleTime: 0,
    });
  }, [queryClient]);

  const fetchCollections = useCallback(async () => {
    // Imports may add requests to collections that are already open and cached.
    await queryClient.invalidateQueries({ queryKey: ['collections'] });
    return refetchCollections();
  }, [queryClient, refetchCollections]);

  const collections: CollectionWithRequests[] = rawCollections.map((collection, index) => ({
    ...collection,
    requests: requestQueries[index].data ?? [],
    isLoadingRequests: expandedIds.has(collection.id) && requestQueries[index].isPending,
    requestsError: requestQueries[index].isError,
  }));

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
    await folderService.reorderFolders(workspaceId, items);
    await fetchFolders();
  };

  const updateRequestTags = async (id: string, tagsList: string[]) => updateRequestTagsMut.mutateAsync({ id, tags: tagsList });
  
  const searchRequests = useCallback(async (params: any) => {
    if (!workspaceId) return [];
    return collectionService.searchRequests({ workspaceId, ...params });
  }, [workspaceId]);

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
