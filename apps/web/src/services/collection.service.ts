import { apiService } from './api.service';
import { Collection, SavedRequest } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';

class CollectionService {
  async getCollections(workspaceId: string): Promise<Collection[]> {
    const response = await apiService.get<Collection[]>(
      `/workspaces/${workspaceId}/collections`
    );
    return response.data.data || [];
  }

  async createCollection(
    workspaceId: string,
    name: string,
    folderId?: string | null
  ): Promise<Collection> {
    const response = await apiService.post<Collection>(
      `/workspaces/${workspaceId}/collections`,
      { name, folderId: folderId ?? null }
    );
    return response.data.data as Collection;
  }

  async updateCollection(
    id: string,
    data: { name?: string; folderId?: string | null; order?: number }
  ): Promise<Collection> {
    const response = await apiService.put<Collection>(
      `/collections/${id}`,
      data
    );
    return response.data.data as Collection;
  }

  async deleteCollection(id: string): Promise<void> {
    await apiService.delete(`/collections/${id}`);
  }

  async reorderCollections(
    items: { id: string; order: number; folderId?: string | null }[]
  ): Promise<void> {
    await apiService.patch(`/collections/reorder`, { items });
  }

  async getSavedRequests(collectionId: string): Promise<SavedRequest[]> {
    const response = await apiService.get<SavedRequest[]>(
      `/requests/${collectionId}/requests`
    );
    return response.data.data || [];
  }

  async saveRequest(collectionId: string, data: SaveRequestInput): Promise<SavedRequest> {
    const response = await apiService.post<SavedRequest>(
      `/requests/${collectionId}/requests`,
      data
    );
    return response.data.data as SavedRequest;
  }

  async updateSavedRequest(
    id: string,
    data: Partial<SaveRequestInput> & { collectionId?: string; order?: number }
  ): Promise<SavedRequest> {
    const response = await apiService.put<SavedRequest>(
      `/requests/${id}`,
      data
    );
    return response.data.data as SavedRequest;
  }

  async updateRequestTags(id: string, tags: string[]): Promise<SavedRequest> {
    const response = await apiService.put<SavedRequest>(
      `/requests/${id}/tags`,
      { tags }
    );
    return response.data.data as SavedRequest;
  }

  async reorderRequests(items: { id: string; order: number; collectionId?: string }[]): Promise<void> {
    await apiService.patch(`/requests/reorder`, { items });
  }

  async shareCollection(id: string): Promise<{ token: string }> {
    const response = await apiService.post<{ token: string }>(`/collections/${id}/share`, {});
    return response.data.data as { token: string };
  }

  async shareRequest(id: string): Promise<{ token: string }> {
    const response = await apiService.post<{ token: string }>(`/requests/${id}/share`, {});
    return response.data.data as { token: string };
  }

  async searchRequests(params: {
    workspaceId: string;
    q?: string;
    tags?: string[];
    collectionId?: string;
    method?: string;
  }): Promise<SavedRequest[]> {
    const searchParams = new URLSearchParams();
    searchParams.set('workspaceId', params.workspaceId);
    if (params.q) searchParams.set('q', params.q);
    if (params.collectionId) searchParams.set('collectionId', params.collectionId);
    if (params.method) searchParams.set('method', params.method);
    if (params.tags && params.tags.length > 0) {
      searchParams.set('tags', params.tags.join(','));
    }

    const response = await apiService.get<SavedRequest[]>(
      `/requests/search?${searchParams.toString()}`
    );
    return response.data.data || [];
  }

  async deleteSavedRequest(id: string): Promise<void> {
    await apiService.delete(`/requests/${id}`);
  }
}

export const collectionService = new CollectionService();
