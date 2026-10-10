import { describe, expect, it } from 'vitest';
import { savedRequestsFromResponse } from '../saved-requests-response';

describe('savedRequestsFromResponse', () => {
  const request = { id: 'request-1', name: 'Get user' };

  it('extracts the array from the API pagination envelope', () => {
    expect(savedRequestsFromResponse({ data: [request], total: 1, page: 1, limit: 50, totalPages: 1 })).toEqual([request]);
  });

  it('accepts the older direct array response', () => {
    expect(savedRequestsFromResponse([request])).toEqual([request]);
  });

  it('rejects a malformed response before the UI attempts to render it', () => {
    expect(() => savedRequestsFromResponse({ total: 1 })).toThrow('Unexpected saved requests response');
  });
});
