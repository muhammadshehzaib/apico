import { z } from 'zod';

export const createEnvironmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
});

export const variableSchema = z.object({
  key: z.string().min(1, 'Variable key is required'),
  value: z.string(),
  enabled: z.boolean(),
  isSecret: z.boolean(),
});

export const bulkUpdateVariablesSchema = z.object({
  variables: z.array(variableSchema),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
export type VariableInput = z.infer<typeof variableSchema>;
export type BulkUpdateVariablesInput = z.infer<typeof bulkUpdateVariablesSchema>;
