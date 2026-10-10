import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CollectionsSidebar } from '../CollectionsSidebar';
import { collectionService } from '@/services/collection.service';
import { folderService } from '@/services/folder.service';
import { tagService } from '@/services/tag.service';
import { workspaceService } from '@/services/workspace.service';

vi.mock('@/hooks/useEnvironment', () => ({ useEnvironment: () => ({ activeEnvironment: null }) }));

const imported = JSON.parse(readFileSync(resolve(process.cwd(), '../../apico-all-apis.apico_import.json'), 'utf8'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(collectionService, 'getCollections').mockResolvedValue(imported.collections);
  vi.spyOn(folderService, 'getFolders').mockResolvedValue([]);
  vi.spyOn(tagService, 'getTags').mockResolvedValue([]);
  vi.spyOn(collectionService, 'getSavedRequests').mockImplementation(async (id) =>
    imported.requests.filter((request: { collectionId: string }) => request.collectionId === id));
});

function renderSidebar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const onLoadRequest = vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <CollectionsSidebar workspaceId="workspace" onLoadRequest={onLoadRequest}
        currentRequest={{ method: 'GET', url: '' }} onSaveRequest={vi.fn()} />
    </QueryClientProvider>
  );
  return { client, onLoadRequest, ...view };
}

describe('imported collection requests', () => {
  it('fetches requests when expanded and loads a selected imported request', async () => {
    const { onLoadRequest } = renderSidebar();
    const collection = await screen.findByRole('button', { name: '01 - Health and Auth' });
    expect(collectionService.getSavedRequests).not.toHaveBeenCalled();
    fireEvent.click(collection);
    const health = await screen.findByText('GET Health check');
    expect(collectionService.getSavedRequests).toHaveBeenCalledWith('api-1');
    expect(screen.getByText('POST Register')).toBeInTheDocument();
    expect(screen.queryByText('No requests')).not.toBeInTheDocument();
    fireEvent.click(health);
    expect(onLoadRequest).toHaveBeenCalledWith(imported.requests[0]);
  });

  it('shows a loading state until the request list arrives', async () => {
    let finish!: (value: typeof imported.requests) => void;
    vi.mocked(collectionService.getSavedRequests).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    renderSidebar();
    fireEvent.click(await screen.findByRole('button', { name: '01 - Health and Auth' }));
    expect(screen.queryByText('No requests')).not.toBeInTheDocument();
    finish(imported.requests.filter((request: { collectionId: string }) => request.collectionId === 'api-1'));
    expect(await screen.findByText('GET Health check')).toBeInTheDocument();
  });

  it('shows an error and supports retry instead of calling the collection empty', async () => {
    vi.mocked(collectionService.getSavedRequests).mockRejectedValueOnce(new Error('Offline'));
    renderSidebar();
    fireEvent.click(await screen.findByRole('button', { name: '01 - Health and Auth' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load requests');
    expect(screen.queryByText('No requests')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('GET Health check')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows No requests only after an empty response', async () => {
    vi.mocked(collectionService.getSavedRequests).mockResolvedValueOnce([]);
    renderSidebar();
    fireEvent.click(await screen.findByRole('button', { name: '01 - Health and Auth' }));
    expect(await screen.findByText('No requests')).toBeInTheDocument();
  });

  it('refreshes requests in an already expanded collection after an import', async () => {
    vi.mocked(collectionService.getSavedRequests).mockResolvedValueOnce([]);
    vi.spyOn(workspaceService, 'importApico').mockResolvedValue({} as never);
    const { container } = renderSidebar();
    fireEvent.click(await screen.findByRole('button', { name: '01 - Health and Auth' }));
    expect(await screen.findByText('No requests')).toBeInTheDocument();
    const file = new File(['{}'], 'requests.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(imported) });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(await screen.findByText('GET Health check')).toBeInTheDocument();
    await waitFor(() => expect(collectionService.getSavedRequests).toHaveBeenCalledTimes(2));
  });
});
