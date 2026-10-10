import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CollectionsSidebar } from '../CollectionsSidebar';

const { state, showToast } = vi.hoisted(() => ({
  state: {
    collections: [] as any[],
    folders: [] as any[],
    tags: [],
    expandedIds: new Set<string>(),
    reorderCollections: vi.fn(),
    reorderFolders: vi.fn(),
  },
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useCollections', () => ({ useCollections: () => state }));
vi.mock('@/hooks/useEnvironment', () => ({ useEnvironment: () => ({ activeEnvironment: null }) }));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast, message: '', type: 'success', isVisible: false }),
}));

function renderSidebar() {
  render(<CollectionsSidebar workspaceId="workspace" onLoadRequest={vi.fn()}
    currentRequest={{ method: 'GET', url: '' }} onSaveRequest={vi.fn()} />);
}

function row(name: string) {
  const element = screen.getByRole('button', { name }).closest('[draggable]') as HTMLElement;
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ top: 0, height: 40 } as DOMRect);
  return element;
}

function startDrag(source: HTMLElement) {
  const values = new Map<string, string>();
  const dataTransfer = {
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? '',
    effectAllowed: '', dropEffect: '',
  };
  fireEvent.dragStart(source, { dataTransfer });
  return dataTransfer;
}

function drop(target: HTMLElement, dataTransfer: ReturnType<typeof startDrag>, clientY: number) {
  // jsdom has no DragEvent constructor; set coordinates explicitly on a native event.
  for (const type of ['dragover', 'drop']) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      dataTransfer: { value: dataTransfer }, clientY: { value: clientY },
    });
    fireEvent(target, event);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  state.collections = ['A', 'B', 'C'].map((id) => ({
    id, name: id, order: 0, folderId: null, requests: [], isLoadingRequests: false,
  }));
  state.folders = [
    { id: 'f1', name: 'Folder one', order: 0, parentId: null },
    { id: 'f2', name: 'Folder two', order: 0, parentId: null },
  ];
  state.reorderCollections.mockResolvedValue(undefined);
  state.reorderFolders.mockResolvedValue(undefined);
});

describe('collections sidebar drag and drop', () => {
  it('inserts before a collection and renumbers duplicate imported order values', async () => {
    renderSidebar();
    const transfer = startDrag(row('C'));
    drop(row('A'), transfer, 2);
    await waitFor(() => expect(state.reorderCollections).toHaveBeenCalledWith([
      { id: 'C', order: 0, folderId: null },
      { id: 'A', order: 1, folderId: null },
      { id: 'B', order: 2, folderId: null },
    ]));
  });

  it('inserts after the target without swapping unrelated rows', async () => {
    renderSidebar();
    const transfer = startDrag(row('A'));
    drop(row('C'), transfer, 38);
    await waitFor(() => expect(state.reorderCollections).toHaveBeenCalledWith([
      { id: 'B', order: 0, folderId: null },
      { id: 'C', order: 1, folderId: null },
      { id: 'A', order: 2, folderId: null },
    ]));
  });

  it('moves a collection into a folder and opens that folder', async () => {
    renderSidebar();
    const transfer = startDrag(row('A'));
    drop(row('Folder one'), transfer, 20);
    await waitFor(() => expect(state.reorderCollections).toHaveBeenCalledWith([
      { id: 'A', order: 0, folderId: 'f1' },
    ]));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Folder one' })
      .closest('[draggable]')?.nextElementSibling).not.toBeNull());
  });

  it('reorders folders at the row edge', async () => {
    renderSidebar();
    const transfer = startDrag(row('Folder two'));
    drop(row('Folder one'), transfer, 2);
    await waitFor(() => expect(state.reorderFolders).toHaveBeenCalledWith([
      { id: 'f2', order: 0, parentId: null },
      { id: 'f1', order: 1, parentId: null },
    ]));
  });

  it('moves a nested collection back to the top level', async () => {
    state.collections[0].folderId = 'f1';
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Folder one' }));
    const transfer = startDrag(row('A'));
    drop(screen.getByText('Drop here to move to top level'), transfer, 20);
    await waitFor(() => expect(state.reorderCollections).toHaveBeenCalledWith([
      { id: 'B', order: 0, folderId: null },
      { id: 'C', order: 1, folderId: null },
      { id: 'A', order: 2, folderId: null },
    ]));
  });

  it('prevents dropping a folder into its descendant', async () => {
    state.folders[1].parentId = 'f1';
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Folder one' }));
    const transfer = startDrag(row('Folder one'));
    drop(row('Folder two'), transfer, 20);
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(
      'Cannot move a folder into itself or its descendants', 'error'));
    expect(state.reorderFolders).not.toHaveBeenCalled();
  });

  it('reports a failed save and clears the drag state', async () => {
    state.reorderCollections.mockRejectedValueOnce(new Error('Network error'));
    renderSidebar();
    const transfer = startDrag(row('A'));
    drop(row('C'), transfer, 38);
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(
      'Failed to move item. Please try again.', 'error'));
    expect(screen.queryByText('Drop here to move to top level')).not.toBeInTheDocument();
  });
});
