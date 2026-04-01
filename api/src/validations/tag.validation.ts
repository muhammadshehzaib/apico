import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
