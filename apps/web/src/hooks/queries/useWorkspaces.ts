import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  detail: (id: string) => [...workspaceKeys.all, id] as const,
  members: (id: string) => [...workspaceKeys.detail(id), 'members'] as const,
  invites: (id: string) => [...workspaceKeys.detail(id), 'invites'] as const,
  userPendingInvites: ['user', 'invites', 'pending'] as const,
};

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => workspaceService.getWorkspaces(),
  });
}

export function useWorkspaceQuery(id: string | null) {
  return useQuery({
    queryKey: workspaceKeys.detail(id!),
    queryFn: () => workspaceService.getWorkspace(id!),
    enabled: !!id,
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspaceService.createWorkspace(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useWorkspaceMembersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId!),
    queryFn: () => workspaceService.getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useWorkspaceInvitesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.invites(workspaceId!),
    queryFn: () => workspaceService.getWorkspaceInvites(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUserPendingInvitesQuery() {
  return useQuery({
    queryKey: workspaceKeys.userPendingInvites,
    queryFn: () => workspaceService.getUserPendingInvites(),
  });
}

export function useInviteToWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: string }) =>
      workspaceService.inviteToWorkspace(workspaceId, email, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.invites(variables.workspaceId) });
    },
  });
}
