import { apiService } from './api.service';
import { Folder } from '@/types';

class FolderService {
  async getFolders(workspaceId: string): Promise<Folder[]> {
    const response = await apiService.get<Folder[]>(
      `/workspaces/${workspaceId}/folders`
    );
    return response.data.data || [];
  }

  async createFolder(workspaceId: string, name: string, parentId?: string | null): Promise<Folder> {
    const response = await apiService.post<Folder>(
      `/workspaces/${workspaceId}/folders`,
      { name, parentId: parentId ?? null }
    );
    return response.data.data as Folder;
  }

  async updateFolder(
    workspaceId: string,
    id: string,
    data: { name?: string; parentId?: string | null; order?: number }
  ): Promise<Folder> {
    const response = await apiService.put<Folder>(
      `/workspaces/${workspaceId}/folders/${id}`,
      data
    );
    return response.data.data as Folder;
  }

  async deleteFolder(workspaceId: string, id: string): Promise<void> {
    await apiService.delete(`/workspaces/${workspaceId}/folders/${id}`);
  }

  async reorderFolders(
    workspaceId: string,
    items: { id: string; order: number; parentId?: string | null }[]
  ): Promise<void> {
    await apiService.patch(`/workspaces/${workspaceId}/folders/reorder`, { items });
  }
}

export const folderService = new FolderService();
