import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { Workspace, Collection, SavedRequest, ExecuteRequestResult } from '@/types';
import { ExecuteRequestInput, SaveRequestInput } from '@/validations/request.validation';

class WorkspaceService {
  async createWorkspace(name: string): Promise<Workspace | null> {
    const response = await apiService.post<Workspace>(API_ENDPOINTS.WORKSPACES, { name });
    return response.data.data;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiService.get<Workspace[]>(API_ENDPOINTS.WORKSPACES);
    return response.data.data || [];
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const response = await apiService.get<Workspace>(API_ENDPOINTS.WORKSPACE_BY_ID(id));
    return response.data.data;
  }

  async inviteToWorkspace(workspaceId: string, email: string, role: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.INVITE_TO_WORKSPACE(workspaceId), {
      email,
      role,
    });
  }

  async createCollection(workspaceId: string, name: string): Promise<Collection | null> {
    const response = await apiService.post<Collection>(
      API_ENDPOINTS.COLLECTIONS_BY_WORKSPACE(workspaceId),
      { name }
    );
    return response.data.data;
  }

  async getCollections(workspaceId: string): Promise<Collection[]> {
    const response = await apiService.get<Collection[]>(
      API_ENDPOINTS.COLLECTIONS_BY_WORKSPACE(workspaceId)
    );
    return response.data.data || [];
  }

  async updateCollection(id: string, name: string): Promise<Collection | null> {
    const response = await apiService.put<Collection>(API_ENDPOINTS.COLLECTION_BY_ID(id), {
      name,
    });
    return response.data.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.COLLECTION_BY_ID(id));
  }

  async executeRequest(payload: ExecuteRequestInput): Promise<ExecuteRequestResult> {
    const response = await apiService.post<any>(
      API_ENDPOINTS.EXECUTE_REQUEST,
      payload
    );
    // Backend wraps result in ApiResponse: { success, data: ExecuteRequestResult }
    // apiService already unwraps axios response.data → ApiResponse
    // So response.data is ApiResponse, and response.data.data is the actual result
    return (response.data?.data ?? response.data) as ExecuteRequestResult;
  }

  async saveRequest(collectionId: string, data: SaveRequestInput): Promise<SavedRequest | null> {
    const response = await apiService.post<SavedRequest>(
      API_ENDPOINTS.SAVE_REQUEST(collectionId),
      data
    );
    return response.data.data;
  }

  async getSavedRequests(collectionId: string): Promise<SavedRequest[]> {
    const response = await apiService.get<SavedRequest[]>(
      API_ENDPOINTS.SAVED_REQUESTS(collectionId)
    );
    return response.data.data || [];
  }

  async updateSavedRequest(id: string, data: Partial<SaveRequestInput>): Promise<SavedRequest | null> {
    const response = await apiService.put<SavedRequest>(
      API_ENDPOINTS.SAVED_REQUEST_BY_ID(id),
      data
    );
    return response.data.data;
  }

  async deleteSavedRequest(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SAVED_REQUEST_BY_ID(id));
  }

  async shareRequest(id: string, expiresAt?: string): Promise<{ token: string } | null> {
    const response = await apiService.post<{ token: string }>(
      API_ENDPOINTS.SHARE_REQUEST(id),
      { expiresAt }
    );
    return response.data.data;
  }
}

export const workspaceService = new WorkspaceService();
