import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const reorderFoldersSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().nonnegative(),
      parentId: z.string().nullable().optional(),
    })
  ),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type ReorderFoldersInput = z.infer<typeof reorderFoldersSchema>;
