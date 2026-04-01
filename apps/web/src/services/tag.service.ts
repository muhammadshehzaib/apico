import { apiService } from './api.service';
import { Tag } from '@/types';

class TagService {
  async getTags(workspaceId: string): Promise<Tag[]> {
    const response = await apiService.get<Tag[]>(
      `/workspaces/${workspaceId}/tags`
    );
    return response.data.data || [];
  }

  async createTag(workspaceId: string, name: string): Promise<Tag> {
    const response = await apiService.post<Tag>(
      `/workspaces/${workspaceId}/tags`,
      { name }
    );
    return response.data.data as Tag;
  }

  async updateTag(workspaceId: string, id: string, name: string): Promise<Tag> {
    const response = await apiService.put<Tag>(
      `/workspaces/${workspaceId}/tags/${id}`,
      { name }
    );
    return response.data.data as Tag;
  }

  async deleteTag(workspaceId: string, id: string): Promise<void> {
    await apiService.delete(`/workspaces/${workspaceId}/tags/${id}`);
  }
}

export const tagService = new TagService();
