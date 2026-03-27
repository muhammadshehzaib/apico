import { apiService } from './api.service';

export interface EnvironmentVariable {
  id?: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret: boolean;
}

export interface Environment {
  id: string;
  name: string;
  workspaceId: string;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

class EnvironmentServiceFrontend {
  async getEnvironments(workspaceId: string): Promise<Environment[]> {
    const response = await apiService.get<Environment[]>(
      `/workspaces/${workspaceId}/environments`
    );
    return response.data.data || [];
  }

  async getEnvironment(id: string): Promise<Environment> {
    const response = await apiService.get<Environment>(`/environments/${id}`);
    return response.data.data as Environment;
  }

  async createEnvironment(workspaceId: string, name: string): Promise<Environment> {
    const response = await apiService.post<Environment>(
      `/workspaces/${workspaceId}/environments`,
      { name }
    );
    return response.data.data as Environment;
  }

  async updateEnvironment(id: string, name: string): Promise<Environment> {
    const response = await apiService.put<Environment>(`/environments/${id}`, { name });
    return response.data.data as Environment;
  }

  async deleteEnvironment(id: string): Promise<void> {
    await apiService.delete(`/environments/${id}`);
  }

  async bulkUpdateVariables(
    environmentId: string,
    variables: EnvironmentVariable[]
  ): Promise<void> {
    await apiService.put(`/environments/${environmentId}/variables`, { variables });
  }
}

export const environmentServiceFrontend = new EnvironmentServiceFrontend();
