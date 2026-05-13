import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';

export const historyKeys = {
  all: ['history'] as const,
  paginated: (page: number, limit: number) => [...historyKeys.all, { page, limit }] as const,
};

export function useHistoryQuery(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: historyKeys.paginated(page, limit),
    queryFn: () => workspaceService.getHistory(page, limit),
  });
}

export function useDeleteHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.deleteHistoryEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useClearHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => workspaceService.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
