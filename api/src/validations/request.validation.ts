import { z } from 'zod';
import { ExecuteRequestPayload, HttpMethod } from '../types';

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

export const executeRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const),
  url: z.string().url('Invalid URL'),
  headers: z.array(keyValuePairSchema),
  params: z.array(keyValuePairSchema),
  body: z.string().optional(),
  auth: requestAuthSchema.optional(),
});

export const saveRequestSchema = z.object({
  name: z.string().min(1, 'Request name is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const),
  url: z.string().url('Invalid URL'),
  headers: z.array(keyValuePairSchema),
  params: z.array(keyValuePairSchema),
  body: z.string().optional(),
  auth: requestAuthSchema.optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
});

export const shareRequestSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

export type ExecuteRequestInput = z.infer<typeof executeRequestSchema>;
export type SaveRequestInput = z.infer<typeof saveRequestSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type ShareRequestInput = z.infer<typeof shareRequestSchema>;
