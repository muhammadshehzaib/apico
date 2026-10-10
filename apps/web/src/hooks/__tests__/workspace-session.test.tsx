import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import workspaceReducer, { setActiveWorkspace } from '@/store/slices/workspace.slice';
import { WorkspaceSession } from '@/providers/WorkspaceSession';
import { HistorySidebar } from '@/components/request/HistorySidebar';
import { workspaceService } from '@/services/workspace.service';

const session = vi.hoisted(() => ({ user: { id: 'user-1' } as { id: string } | null, pathname: '/request' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: session.user, isLoading: false }) }));
vi.mock('next/navigation', () => ({ usePathname: () => session.pathname }));
vi.mock('@/hooks/useCollections', () => ({ useCollections: () => ({ collections: [] }) }));
vi.mock('@/components/collections/SaveRequestModal', () => ({ SaveRequestModal: () => null }));
vi.mock('@/components/collections/CollectionsSidebar', () => ({
  CollectionsSidebar: ({ workspaceId, isWorkspaceLoading }: { workspaceId: string | null; isWorkspaceLoading: boolean }) =>
    <div>{isWorkspaceLoading ? 'Restoring workspace...' : workspaceId ? `Collections for ${workspaceId}` : 'No workspace'}</div>,
}));

const workspaces = [
  { id: 'w1', name: 'Personal' },
  { id: 'w2', name: 'Team' },
] as Awaited<ReturnType<typeof workspaceService.getWorkspaces>>;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  session.user = { id: 'user-1' };
  session.pathname = '/request';
  vi.spyOn(workspaceService, 'getWorkspaces').mockResolvedValue(workspaces);
});

function setup(activeId?: string) {
  const store = configureStore({ reducer: { workspace: workspaceReducer } });
  if (activeId) store.dispatch(setActiveWorkspace(activeId));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const view = render(<QueryClientProvider client={client}><Provider store={store}>
    <WorkspaceSession />
    <HistorySidebar history={[]} onNewRequest={vi.fn()} onLoadRequest={vi.fn()} isLoading={false}
      currentRequest={{ method: 'GET', url: '' }} onSaveRequest={vi.fn()} />
  </Provider></QueryClientProvider>);
  return { store, ...view };
}

describe('workspace selection in the requester', () => {
  it('restores the selected workspace after a refresh', async () => {
    localStorage.setItem('apico_active_workspace_user-1', 'w2');
    const { store } = setup();
    expect(await screen.findByText('Collections for w2')).toBeInTheDocument();
    expect(store.getState().workspace.activeWorkspaceId).toBe('w2');
    expect(screen.getByLabelText('Workspace')).toHaveValue('w2');
    expect(screen.getByRole('link', { name: 'Manage workspace' })).toHaveAttribute('href', '/workspace/w2');
  });

  it('switches collections inside the requester and persists the selection', async () => {
    setup();
    expect(await screen.findByText('Collections for w1')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Workspace'), { target: { value: 'w2' } });
    expect(await screen.findByText('Collections for w2')).toBeInTheDocument();
    expect(localStorage.getItem('apico_active_workspace_user-1')).toBe('w2');
  });

  it('keeps the workspace opened through its URL', async () => {
    session.pathname = '/workspace/w2/collection/c1';
    localStorage.setItem('apico_active_workspace_user-1', 'w1');
    setup();
    expect(await screen.findByText('Collections for w2')).toBeInTheDocument();
  });

  it('falls back to an accessible workspace when the saved one was removed', async () => {
    localStorage.setItem('apico_active_workspace_user-1', 'removed');
    setup('removed');
    expect(await screen.findByText('Collections for w1')).toBeInTheDocument();
    expect(localStorage.getItem('apico_active_workspace_user-1')).toBe('w1');
  });

  it('shows loading while restoring the workspace', async () => {
    let finish!: (value: typeof workspaces) => void;
    vi.mocked(workspaceService.getWorkspaces).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    setup();
    expect(await screen.findByText('Restoring workspace...')).toBeInTheDocument();
    expect(screen.getByLabelText('Workspace')).toBeDisabled();
    finish(workspaces);
    expect(await screen.findByText('Collections for w1')).toBeInTheDocument();
  });

  it('clears workspace state for a signed out user without fetching workspaces', async () => {
    session.user = null;
    const { store } = setup('w2');
    await waitFor(() => expect(store.getState().workspace.activeWorkspaceId).toBeNull());
    expect(workspaceService.getWorkspaces).not.toHaveBeenCalled();
  });

  it('does not restore a different account’s selection', async () => {
    localStorage.setItem('apico_active_workspace_other-user', 'w2');
    setup();
    expect(await screen.findByText('Collections for w1')).toBeInTheDocument();
  });
});
