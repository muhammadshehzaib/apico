import { z } from 'zod';
import { HttpMethod } from '../types';

const keyValuePairSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

const requestAuthSchema = z.object({
  type: z.enum(['none', 'bearer', 'basic', 'apikey']),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  apiKey: z.string().optional(),
  apiValue: z.string().optional(),
  apiIn: z.enum(['header', 'query']).optional(),
});

export const formDataFieldSchema = z.object({
  key: z.string(),
  type: z.enum(['text', 'file']),
  value: z.string(),
  fileName: z.string().optional(),
  enabled: z.boolean(),
});

export const formDataMetadataSchema = z.object({
  method: z.nativeEnum(HttpMethod),
  url: z.string().url('Invalid URL'),
  headers: z.array(keyValuePairSchema),
  params: z.array(keyValuePairSchema),
  bodyType: z.literal('form-data'),
  fields: z.array(formDataFieldSchema),
  auth: requestAuthSchema.optional(),
});

export const executeRequestSchema = z.object({
  method: z.nativeEnum(HttpMethod),
  url: z.string().url('Invalid URL'),
  headers: z.array(keyValuePairSchema),
  params: z.array(keyValuePairSchema),
  body: z.string().optional(),
  auth: requestAuthSchema.optional(),
});

export const saveRequestSchema = z.object({
  name: z.string().min(1, 'Request name is required'),
  method: z.nativeEnum(HttpMethod),
  url: z.string().url('Invalid URL'),
  headers: z.array(keyValuePairSchema),
  params: z.array(keyValuePairSchema),
  body: z.string().optional(),
  auth: requestAuthSchema.optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  folderId: z.string().nullable().optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const updateSavedRequestSchema = saveRequestSchema
  .partial()
  .extend({
    collectionId: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  });

export const updateRequestTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const reorderCollectionsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().nonnegative(),
      folderId: z.string().nullable().optional(),
    })
  ),
});

export const reorderRequestsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().nonnegative(),
      collectionId: z.string().optional(),
    })
  ),
});

export const shareRequestSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

export const shareCollectionSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

export type ExecuteRequestInput = z.infer<typeof executeRequestSchema>;
export type SaveRequestInput = z.infer<typeof saveRequestSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type UpdateSavedRequestInput = z.infer<typeof updateSavedRequestSchema>;
export type UpdateRequestTagsInput = z.infer<typeof updateRequestTagsSchema>;
export type ReorderCollectionsInput = z.infer<typeof reorderCollectionsSchema>;
export type ReorderRequestsInput = z.infer<typeof reorderRequestsSchema>;
export type ShareRequestInput = z.infer<typeof shareRequestSchema>;
export type ShareCollectionInput = z.infer<typeof shareCollectionSchema>;
