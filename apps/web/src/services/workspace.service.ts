import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { Workspace, Collection, SavedRequest, ExecuteRequestResult } from '@/types';
import { ExecuteRequestInput, SaveRequestInput } from '@/validations/request.validation';

class WorkspaceService {
  async createWorkspace(name: string): Promise<Workspace> {
    const response = await apiService.post<Workspace>(API_ENDPOINTS.WORKSPACES, { name });
    return response.data;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiService.get<Workspace[]>(API_ENDPOINTS.WORKSPACES);
    return response.data;
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await apiService.get<Workspace>(API_ENDPOINTS.WORKSPACE_BY_ID(id));
    return response.data;
  }

  async inviteToWorkspace(workspaceId: string, email: string, role: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.INVITE_TO_WORKSPACE(workspaceId), {
      email,
      role,
    });
  }

  async createCollection(workspaceId: string, name: string): Promise<Collection> {
    const response = await apiService.post<Collection>(
      API_ENDPOINTS.COLLECTIONS_BY_WORKSPACE(workspaceId),
      { name }
    );
    return response.data;
  }

  async getCollections(workspaceId: string): Promise<Collection[]> {
    const response = await apiService.get<Collection[]>(
      API_ENDPOINTS.COLLECTIONS_BY_WORKSPACE(workspaceId)
    );
    return response.data;
  }

  async updateCollection(id: string, name: string): Promise<Collection> {
    const response = await apiService.put<Collection>(API_ENDPOINTS.COLLECTION_BY_ID(id), {
      name,
    });
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.COLLECTION_BY_ID(id));
  }

  async executeRequest(payload: ExecuteRequestInput): Promise<ExecuteRequestResult> {
    const response = await apiService.post<ExecuteRequestResult>(
      API_ENDPOINTS.EXECUTE_REQUEST,
      payload
    );
    return response.data;
  }

  async saveRequest(collectionId: string, data: SaveRequestInput): Promise<SavedRequest> {
    const response = await apiService.post<SavedRequest>(
      API_ENDPOINTS.SAVE_REQUEST(collectionId),
      data
    );
    return response.data;
  }

  async getSavedRequests(collectionId: string): Promise<SavedRequest[]> {
    const response = await apiService.get<SavedRequest[]>(
      API_ENDPOINTS.SAVED_REQUESTS(collectionId)
    );
    return response.data;
  }

  async updateSavedRequest(id: string, data: Partial<SaveRequestInput>): Promise<SavedRequest> {
    const response = await apiService.put<SavedRequest>(
      API_ENDPOINTS.SAVED_REQUEST_BY_ID(id),
      data
    );
    return response.data;
  }

  async deleteSavedRequest(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SAVED_REQUEST_BY_ID(id));
  }

  async shareRequest(id: string, expiresAt?: string): Promise<{ token: string }> {
    const response = await apiService.post<{ token: string }>(
      API_ENDPOINTS.SHARE_REQUEST(id),
      { expiresAt }
    );
    return response.data;
  }
}

export const workspaceService = new WorkspaceService();
