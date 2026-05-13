'use client';

import { useState } from 'react';
import { 
  useEnvironmentsQuery,
  useCreateEnvironmentMutation,
  useUpdateEnvironmentMutation,
  useDeleteEnvironmentMutation,
  useBulkUpdateVariablesMutation
} from './queries/useEnvironments';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setActiveEnvironment as setReduxActiveEnvironment } from '@/store/slices/workspace.slice';

export function useEnvironment(workspaceId: string | null) {
  const dispatch = useDispatch();
  const activeEnvironmentId = useSelector((state: RootState) => state.workspace.activeEnvironmentId);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const { data: environments = [], isLoading, error: queryError } = useEnvironmentsQuery(workspaceId);
  const createMut = useCreateEnvironmentMutation();
  const updateMut = useUpdateEnvironmentMutation();
  const deleteMut = useDeleteEnvironmentMutation();
  const bulkUpdateMut = useBulkUpdateVariablesMutation();

  const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId) || null;

  const setActiveEnvironment = (id: string | null) => {
    dispatch(setReduxActiveEnvironment(id));
  };

  const createEnvironment = async (name: string) => {
    if (!workspaceId) return null;
    const res = await createMut.mutateAsync({ workspaceId, name });
    return res;
  };

  const updateEnvironment = async (id: string, name: string) => {
    await updateMut.mutateAsync({ id, name });
  };

  const deleteEnvironment = async (id: string) => {
    await deleteMut.mutateAsync(id);
    if (activeEnvironmentId === id) {
      setActiveEnvironment(null);
    }
  };

  const saveVariables = async (id: string, variables: any[]) => {
    await bulkUpdateMut.mutateAsync({ id, variables });
  };

  return {
    environments,
    activeEnvironment,
    activeEnvironmentId,
    isLoading,
    error: queryError ? (queryError as Error).message : null,
    isManagerOpen,
    setActiveEnvironment,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    saveVariables,
    openManager: () => setIsManagerOpen(true),
    closeManager: () => setIsManagerOpen(false),
  };
}
