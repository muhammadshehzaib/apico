import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/constants/api.constants';
import {
  Workspace,
  Collection,
  SavedRequest,
  ExecuteRequestResult,
  RequestHistory,
  SharedCollection,
  WorkspaceInvite,
  WorkspaceMemberWithUser,
  WorkspacePendingInvite,
  PendingInviteForUser,
} from '@/types';
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

  async inviteToWorkspace(
    workspaceId: string,
    email: string,
    role: string
  ): Promise<{ invite: any; inviteLink: string } | null> {
    const response = await apiService.post<{ invite: any; inviteLink: string }>(
      API_ENDPOINTS.INVITE_TO_WORKSPACE(workspaceId),
      {
        email,
        role,
      }
    );
    return response.data.data;
  }

  async getWorkspaceInvite(token: string): Promise<WorkspaceInvite | null> {
    const response = await apiService.get<WorkspaceInvite>(
      API_ENDPOINTS.WORKSPACE_INVITE_BY_TOKEN(token)
    );
    return response.data.data;
  }

  async acceptWorkspaceInvite(token: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.ACCEPT_WORKSPACE_INVITE(token));
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const response = await apiService.get<WorkspaceMemberWithUser[]>(
      API_ENDPOINTS.WORKSPACE_MEMBERS(workspaceId)
    );
    return response.data.data || [];
  }

  async getWorkspaceInvites(workspaceId: string): Promise<WorkspacePendingInvite[]> {
    const response = await apiService.get<WorkspacePendingInvite[]>(
      API_ENDPOINTS.WORKSPACE_INVITES(workspaceId)
    );
    return response.data.data || [];
  }

  async revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.REVOKE_WORKSPACE_INVITE(workspaceId, inviteId));
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.WORKSPACE_MEMBER(workspaceId, userId));
  }

  async updateMemberRole(workspaceId: string, userId: string, role: string): Promise<WorkspaceMemberWithUser | null> {
    const response = await apiService.patch<WorkspaceMemberWithUser>(
      API_ENDPOINTS.WORKSPACE_MEMBER(workspaceId, userId),
      { role }
    );
    return response.data.data;
  }

  async getUserPendingInvites(): Promise<PendingInviteForUser[]> {
    const response = await apiService.get<PendingInviteForUser[]>(
      API_ENDPOINTS.USER_PENDING_INVITES
    );
    return response.data.data || [];
  }

  async declineWorkspaceInvite(token: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.DECLINE_WORKSPACE_INVITE(token));
  }

  async leaveWorkspace(workspaceId: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.LEAVE_WORKSPACE(workspaceId));
  }

  async clearWorkspaceData(workspaceId: string): Promise<{ collectionsDeleted: number; foldersDeleted: number; tagsDeleted: number } | null> {
    const response = await apiService.delete<{ collectionsDeleted: number; foldersDeleted: number; tagsDeleted: number }>(
      API_ENDPOINTS.CLEAR_WORKSPACE_DATA(workspaceId)
    );
    return response.data.data ?? null;
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

  async importApico(workspaceId: string, payload: any): Promise<any> {
    const response = await apiService.post<any>(
      `/workspaces/${workspaceId}/import`,
      payload
    );
    return response.data.data;
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

  async executeFormDataRequest(formData: FormData): Promise<ExecuteRequestResult> {
    const response = await apiService.post<any>(
      API_ENDPOINTS.EXECUTE_REQUEST,
      formData,
    );
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

  async shareCollection(id: string, expiresAt?: string): Promise<{ token: string } | null> {
    const response = await apiService.post<{ token: string }>(
      API_ENDPOINTS.SHARE_COLLECTION(id),
      { expiresAt }
    );
    return response.data.data;
  }

  async getSharedRequest(token: string): Promise<SavedRequest | null> {
    const response = await apiService.get<SavedRequest>(
      API_ENDPOINTS.GET_SHARED_REQUEST(token)
    );
    return response.data.data;
  }

  async getSharedCollection(token: string): Promise<SharedCollection | null> {
    const response = await apiService.get<SharedCollection>(
      API_ENDPOINTS.GET_SHARED_COLLECTION(token)
    );
    return response.data.data;
  }

  async getHistory(page: number = 1, limit: number = 50): Promise<RequestHistory[]> {
    const response = await apiService.get<RequestHistory[]>(
      API_ENDPOINTS.HISTORY,
      { params: { page, limit } }
    );
    return response.data.data || [];
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.HISTORY_ENTRY(id));
  }

  async clearHistory(): Promise<void> {
    await apiService.delete(API_ENDPOINTS.HISTORY);
  }
}

export const workspaceService = new WorkspaceService();
