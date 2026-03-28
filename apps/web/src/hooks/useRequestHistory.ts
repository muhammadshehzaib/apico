'use client';

import { useState, useCallback } from 'react';
import { RequestHistory } from '@/types';
import { workspaceService } from '@/services/workspace.service';

export function useRequestHistory() {
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async (page: number = 1, limit: number = 50) => {
    setIsLoading(true);
    try {
      const data = await workspaceService.getHistory(page, limit);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await workspaceService.deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await workspaceService.clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, []);

  return {
    history,
    isLoading,
    fetchHistory,
    deleteEntry,
    clearAll,
  };
}
