import type { SavedRequest } from '@/types';

/** The API wraps collection requests in a paginated result. */
export function savedRequestsFromResponse(value: unknown): SavedRequest[] {
  if (Array.isArray(value)) return value as SavedRequest[];
  if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
    return value.data as SavedRequest[];
  }
  throw new Error('Unexpected saved requests response from the API');
}
