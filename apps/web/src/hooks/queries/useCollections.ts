import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionService } from '@/services/collection.service';
import { folderService } from '@/services/folder.service';
import { tagService } from '@/services/tag.service';
import { SaveRequestInput } from '@/validations/request.validation';

export const collectionKeys = {
  all: (workspaceId: string) => ['workspaces', workspaceId, 'collections'] as const,
  requests: (collectionId: string) => ['collections', collectionId, 'requests'] as const,
  folders: (workspaceId: string) => ['workspaces', workspaceId, 'folders'] as const,
  tags: (workspaceId: string) => ['workspaces', workspaceId, 'tags'] as const,
  search: (workspaceId: string, params: any) => ['workspaces', workspaceId, 'requests', 'search', params] as const,
};

export function useCollectionsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: collectionKeys.all(workspaceId!),
    queryFn: () => collectionService.getCollections(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateCollectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name, folderId }: { workspaceId: string; name: string; folderId?: string | null }) =>
      collectionService.createCollection(workspaceId, name, folderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all(variables.workspaceId) });
    },
  });
}

export function useUpdateCollectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => collectionService.updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] }); // Invalidate all workspace collections to be safe, or could be more specific
    },
  });
}

export function useDeleteCollectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionService.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useReorderCollectionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: any[]) => collectionService.reorderCollections(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

// REQUESTS
export function useRequestsQuery(collectionId: string | null) {
  return useQuery({
    queryKey: collectionKeys.requests(collectionId!),
    queryFn: () => collectionService.getSavedRequests(collectionId!),
    enabled: !!collectionId,
  });
}

export function useSaveRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: SaveRequestInput }) =>
      collectionService.saveRequest(collectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.requests(variables.collectionId) });
    },
  });
}

export function useUpdateRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => collectionService.updateSavedRequest(id, data),
    onSuccess: (_, variables) => {
      if (variables.data.collectionId) {
        queryClient.invalidateQueries({ queryKey: collectionKeys.requests(variables.data.collectionId) });
      }
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionService.deleteSavedRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useReorderRequestsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: any[]) => collectionService.reorderRequests(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

// FOLDERS
export function useFoldersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: collectionKeys.folders(workspaceId!),
    queryFn: () => folderService.getFolders(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name, parentId }: { workspaceId: string; name: string; parentId?: string | null }) =>
      folderService.createFolder(workspaceId, name, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.folders(variables.workspaceId) });
    },
  });
}

export function useUpdateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, id, data }: { workspaceId: string; id: string; data: any }) =>
      folderService.updateFolder(workspaceId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.folders(variables.workspaceId) });
    },
  });
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, id }: { workspaceId: string; id: string }) =>
      folderService.deleteFolder(workspaceId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.folders(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all(variables.workspaceId) });
    },
  });
}

// TAGS
export function useTagsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: collectionKeys.tags(workspaceId!),
    queryFn: () => tagService.getTags(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateRequestTagsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => collectionService.updateRequestTags(id, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
