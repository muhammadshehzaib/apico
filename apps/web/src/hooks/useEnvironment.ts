'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Environment,
  EnvironmentVariable,
  environmentServiceFrontend,
} from '@/services/environment.service';
import { resolveVariables } from '@/utils/variable.util';

const getStorageKey = (workspaceId: string) => `apico_active_env_${workspaceId}`;

export function useEnvironment(workspaceId: string | null) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironmentId, setActiveEnvironmentIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId) || null;
  const activeVariables = activeEnvironment?.variables || [];

  // Fetch environments on workspace change
  const fetchEnvironments = useCallback(async (wsId: string) => {
    if (!wsId) return;

    setIsLoading(true);
    try {
      const data = await environmentServiceFrontend.getEnvironments(wsId);
      setEnvironments(data);
      setError(null);

      // Load active environment from localStorage
      const saved = localStorage.getItem(getStorageKey(wsId));
      if (saved && data.some((e) => e.id === saved)) {
        setActiveEnvironmentIdState(saved);
      } else if (data.length > 0) {
        // Set first environment as active by default
        setActiveEnvironmentIdState(data[0].id);
      } else {
        setActiveEnvironmentIdState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchEnvironments(workspaceId);
    }
  }, [workspaceId, fetchEnvironments]);

  const setActiveEnvironment = useCallback(
    (environmentId: string | null) => {
      setActiveEnvironmentIdState(environmentId);
      if (workspaceId) {
        if (environmentId) {
          localStorage.setItem(getStorageKey(workspaceId), environmentId);
        } else {
          localStorage.removeItem(getStorageKey(workspaceId));
        }
      }
    },
    [workspaceId]
  );

  const createEnvironment = useCallback(
    async (name: string) => {
      if (!workspaceId) return;

      try {
        const newEnv = await environmentServiceFrontend.createEnvironment(workspaceId, name);
        setEnvironments((prev) => [newEnv, ...prev]);
        setActiveEnvironmentIdState(newEnv.id);
        localStorage.setItem(getStorageKey(workspaceId), newEnv.id);
        setError(null);
        return newEnv;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create environment';
        setError(errorMsg);
        throw err;
      }
    },
    [workspaceId]
  );

  const updateEnvironment = useCallback(async (id: string, name: string) => {
    try {
      const updated = await environmentServiceFrontend.updateEnvironment(id, name);
      setEnvironments((prev) =>
        prev.map((e) => (e.id === id ? updated : e))
      );
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update environment';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const deleteEnvironment = useCallback(async (id: string) => {
    try {
      await environmentServiceFrontend.deleteEnvironment(id);
      setEnvironments((prev) => prev.filter((e) => e.id !== id));
      if (activeEnvironmentId === id) {
        setActiveEnvironmentIdState(null);
      }
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete environment';
      setError(errorMsg);
      throw err;
    }
  }, [activeEnvironmentId]);

  const saveVariables = useCallback(
    async (environmentId: string, variables: EnvironmentVariable[]) => {
      try {
        await environmentServiceFrontend.bulkUpdateVariables(environmentId, variables);
        setEnvironments((prev) =>
          prev.map((e) =>
            e.id === environmentId ? { ...e, variables } : e
          )
        );
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to save variables';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const resolveText = useCallback(
    (text: string): string => {
      return resolveVariables(text, activeVariables);
    },
    [activeVariables]
  );

  return {
    environments,
    activeEnvironment,
    activeEnvironmentId,
    activeVariables,
    isLoading,
    isManagerOpen,
    error,
    fetchEnvironments,
    setActiveEnvironment,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    saveVariables,
    openManager: () => setIsManagerOpen(true),
    closeManager: () => setIsManagerOpen(false),
    resolveText,
  };
}
