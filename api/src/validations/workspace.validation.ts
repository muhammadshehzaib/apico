import { z } from 'zod';
import { WorkspaceRole } from '../types';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
});

export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER'] as const, {
    errorMap: () => ({ message: 'Invalid workspace role' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER'] as const, {
    errorMap: () => ({ message: 'Invalid role. Cannot assign OWNER.' }),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
