'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { workspaceService } from '@/services/workspace.service';
import { workspaceKeys } from '@/hooks/queries/useWorkspaces';
import { setActiveWorkspace, setCurrentWorkspace, setLoading, setWorkspaces } from '@/store/slices/workspace.slice';
import type { RootState } from '@/store';

export function WorkspaceSession() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const activeId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const { data: workspaces, isPending, isError } = useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => workspaceService.getWorkspaces(),
    enabled: !!user?.id && !isAuthLoading,
  });

  useEffect(() => {
    dispatch(setLoading(isAuthLoading || (!!user?.id && isPending)));
    if (isAuthLoading) return;
    if (!user?.id) {
      dispatch(setActiveWorkspace(null));
      dispatch(setCurrentWorkspace(null));
      dispatch(setWorkspaces([]));
      return;
    }
    if (!workspaces || isError) return;

    const storageKey = `apico_active_workspace_${user.id}`;
    let savedId: string | null = null;
    try { savedId = localStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
    const routeId = pathname?.match(/^\/workspace\/([^/]+)/)?.[1];
    const selected = workspaces.find((workspace) => workspace.id === routeId)
      ?? workspaces.find((workspace) => workspace.id === activeId)
      ?? workspaces.find((workspace) => workspace.id === savedId)
      ?? workspaces[0]
      ?? null;

    dispatch(setWorkspaces(workspaces));
    dispatch(setCurrentWorkspace(selected));
    if (activeId !== (selected?.id ?? null)) dispatch(setActiveWorkspace(selected?.id ?? null));
    try {
      if (selected) localStorage.setItem(storageKey, selected.id);
      else localStorage.removeItem(storageKey);
    } catch { /* Keep working without persistence. */ }
  }, [user?.id, isAuthLoading, workspaces, isPending, isError, activeId, pathname, dispatch]);

  return null;
}
