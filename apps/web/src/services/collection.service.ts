import { apiService } from './api.service';
import { Collection, SavedRequest } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';

class CollectionService {
  async getCollections(workspaceId: string): Promise<Collection[]> {
    const response = await apiService.get<Collection[]>(
      `/workspaces/${workspaceId}/collections`
    );
    return response.data;
  }

  async createCollection(workspaceId: string, name: string): Promise<Collection> {
    const response = await apiService.post<Collection>(
      `/workspaces/${workspaceId}/collections`,
      { name }
    );
    return response.data;
  }

  async updateCollection(id: string, name: string): Promise<Collection> {
    const response = await apiService.put<Collection>(
      `/collections/${id}`,
      { name }
    );
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await apiService.delete(`/collections/${id}`);
  }

  async getSavedRequests(collectionId: string): Promise<SavedRequest[]> {
    const response = await apiService.get<SavedRequest[]>(
      `/collections/${collectionId}/requests`
    );
    return response.data;
  }

  async saveRequest(collectionId: string, data: SaveRequestInput): Promise<SavedRequest> {
    const response = await apiService.post<SavedRequest>(
      `/collections/${collectionId}/requests`,
      data
    );
    return response.data;
  }

  async updateSavedRequest(id: string, data: Partial<SaveRequestInput>): Promise<SavedRequest> {
    const response = await apiService.put<SavedRequest>(
      `/requests/${id}`,
      data
    );
    return response.data;
  }

  async deleteSavedRequest(id: string): Promise<void> {
    await apiService.delete(`/requests/${id}`);
  }
}

export const collectionService = new CollectionService();
