'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGuestHistory,
  saveGuestHistory,
  deleteGuestHistoryEntry,
  clearGuestHistory,
  type GuestHistoryEntry,
} from '@/utils/playground.storage';
import { HttpMethod, KeyValuePair } from '@/types';

export function usePlaygroundHistory() {
  const [history, setHistory] = useState<GuestHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(() => {
    try {
      const loaded = getGuestHistory();
      setHistory(loaded);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addEntry = useCallback(
    (entry: Omit<GuestHistoryEntry, 'id' | 'createdAt'>) => {
      try {
        const newEntry = saveGuestHistory(entry);
        setHistory((prev) => [newEntry, ...prev].slice(0, 20));
      } catch {
        // Ignore
      }
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    try {
      deleteGuestHistoryEntry(id);
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch {
      // Ignore
    }
  }, []);

  const clearAll = useCallback(() => {
    try {
      clearGuestHistory();
      setHistory([]);
    } catch {
      // Ignore
    }
  }, []);

  return {
    history,
    isLoading,
    loadHistory,
    addEntry,
    deleteEntry,
    clearAll,
  };
}
