'use client';

import { useHistoryQuery, useDeleteHistoryMutation, useClearHistoryMutation } from './queries/useHistory';

export function useRequestHistory() {
  const { data: history = [], isLoading, error: queryError, refetch } = useHistoryQuery();
  const deleteMutation = useDeleteHistoryMutation();
  const clearMutation = useClearHistoryMutation();

  const fetchHistory = async () => {
    await refetch();
  };

  const deleteHistoryEntry = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const clearHistory = async () => {
    await clearMutation.mutateAsync();
  };

  return {
    history,
    isLoading,
    error: queryError ? (queryError as Error).message : null,
    fetchHistory,
    deleteHistoryEntry,
    clearHistory,
  };
}
