'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGuestEnvironments,
  saveGuestEnvironments,
  getGuestActiveEnv,
  saveGuestActiveEnv,
  type GuestEnvironment,
} from '@/utils/playground.storage';
import type { EnvironmentVariable } from '@/services/environment.service';
import { resolveVariables } from '@/utils/variable.util';

export function usePlaygroundEnvironment() {
  const [environments, setEnvironments] = useState<GuestEnvironment[]>([]);
  const [activeEnvironment, setActiveEnvironmentState] =
    useState<GuestEnvironment | null>(null);
  const [activeVariables, setActiveVariables] = useState<EnvironmentVariable[]>(
    []
  );
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const loadEnvironments = useCallback(() => {
    try {
      const loaded = getGuestEnvironments();
      setEnvironments(loaded);

      const activeEnvId = getGuestActiveEnv();
      if (activeEnvId) {
        const active = loaded.find((e) => e.id === activeEnvId);
        if (active) {
          setActiveEnvironmentState(active);
          setActiveVariables(active.variables);
        }
      }
    } catch {
      setEnvironments([]);
      setActiveEnvironmentState(null);
      setActiveVariables([]);
    }
  }, []);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  const createEnvironment = useCallback((name: string): GuestEnvironment => {
    const newEnv: GuestEnvironment = {
      id: crypto.randomUUID(),
      name,
      variables: [],
      createdAt: new Date().toISOString(),
    };

    setEnvironments((prev) => {
      const updated = [...prev, newEnv];
      saveGuestEnvironments(updated);
      return updated;
    });

    setActiveEnvironmentState(newEnv);
    setActiveVariables([]);
    saveGuestActiveEnv(newEnv.id);

    return newEnv;
  }, []);

  const updateEnvironment = useCallback((id: string, name: string) => {
    setEnvironments((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, name } : e));
      saveGuestEnvironments(updated);
      return updated;
    });
  }, []);

  const deleteEnvironment = useCallback((id: string) => {
    setEnvironments((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveGuestEnvironments(updated);

      if (activeEnvironment?.id === id) {
        setActiveEnvironmentState(null);
        setActiveVariables([]);
        saveGuestActiveEnv(null);
      }

      return updated;
    });
  }, [activeEnvironment]);

  const setActiveEnvironment = useCallback((id: string | null) => {
    if (id === null) {
      setActiveEnvironmentState(null);
      setActiveVariables([]);
      saveGuestActiveEnv(null);
    } else {
      setEnvironments((prevEnvs) => {
        const env = prevEnvs.find((e) => e.id === id);
        if (env) {
          setActiveEnvironmentState(env);
          setActiveVariables(env.variables);
          saveGuestActiveEnv(id);
        }
        return prevEnvs;
      });
    }
  }, []);

  const saveVariables = useCallback(
    (envId: string, variables: EnvironmentVariable[]) => {
      setEnvironments((prev) => {
        const updated = prev.map((e) =>
          e.id === envId ? { ...e, variables } : e
        );
        saveGuestEnvironments(updated);

        if (activeEnvironment?.id === envId) {
          setActiveVariables(variables);
        }

        return updated;
      });
    },
    [activeEnvironment]
  );

  const openManager = useCallback(() => {
    setIsManagerOpen(true);
  }, []);

  const closeManager = useCallback(() => {
    setIsManagerOpen(false);
  }, []);

  const resolveText = useCallback(
    (text: string): string => {
      return resolveVariables(text, activeVariables);
    },
    [activeVariables]
  );

  return {
    environments,
    activeEnvironment,
    activeVariables,
    isManagerOpen,
    loadEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    saveVariables,
    openManager,
    closeManager,
    resolveText,
  };
}
