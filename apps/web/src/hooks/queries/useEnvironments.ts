import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentServiceFrontend } from '@/services/environment.service';

export const environmentKeys = {
  all: (workspaceId: string) => ['workspaces', workspaceId, 'environments'] as const,
  detail: (id: string) => ['environments', id] as const,
};

export function useEnvironmentsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: environmentKeys.all(workspaceId!),
    queryFn: () => environmentServiceFrontend.getEnvironments(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useEnvironmentQuery(id: string | null) {
  return useQuery({
    queryKey: environmentKeys.detail(id!),
    queryFn: () => environmentServiceFrontend.getEnvironment(id!),
    enabled: !!id,
  });
}

export function useCreateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      environmentServiceFrontend.createEnvironment(workspaceId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.all(variables.workspaceId) });
    },
  });
}

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      environmentServiceFrontend.updateEnvironment(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] }); // Invalidate all since we don't have workspaceId here easily
    },
  });
}

export function useDeleteEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => environmentServiceFrontend.deleteEnvironment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useBulkUpdateVariablesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, variables }: { id: string; variables: any[] }) =>
      environmentServiceFrontend.bulkUpdateVariables(id, variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
