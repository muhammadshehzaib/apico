import { z } from 'zod';

const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
});

const folderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

const collectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  folderId: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

const requestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  collectionId: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const),
  url: z.string(),
  headers: z.array(z.any()).optional(),
  params: z.array(z.any()).optional(),
  body: z.string().optional(),
  auth: z.any().optional(),
  order: z.number().int().nonnegative().optional(),
  tags: z.array(tagSchema).optional(),
});

export const importApicoSchema = z.object({
  format: z.literal('apico'),
  version: z.number().int().positive(),
  exportedAt: z.string().optional(),
  folders: z.array(folderSchema).optional(),
  collections: z.array(collectionSchema).optional(),
  requests: z.array(requestSchema).optional(),
  tags: z.array(tagSchema).optional(),
});

export type ImportApicoInput = z.infer<typeof importApicoSchema>;
