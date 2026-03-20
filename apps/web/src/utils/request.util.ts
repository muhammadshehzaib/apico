import { KeyValuePair, RequestAuth } from '@/types';

export const filterEnabledPairs = (pairs: KeyValuePair[]): Record<string, string> => {
  return pairs
    .filter((p) => p.enabled)
    .reduce(
      (acc, p) => {
        acc[p.key] = p.value;
        return acc;
      },
      {} as Record<string, string>
    );
};

export const buildAuthHeader = (auth?: RequestAuth): Record<string, string> => {
  if (!auth || auth.type === 'none') return {};

  const headers: Record<string, string> = {};

  switch (auth.type) {
    case 'bearer':
      headers['Authorization'] = `Bearer ${auth.token}`;
      break;
    case 'basic':
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      break;
    case 'apikey':
      if (auth.apiIn === 'header') {
        headers[auth.apiKey!] = auth.apiValue!;
      }
      break;
  }

  return headers;
};

export const buildApiKeyParam = (auth?: RequestAuth): Record<string, string> => {
  if (!auth || auth.type !== 'apikey' || auth.apiIn !== 'query') return {};

  return {
    [auth.apiKey!]: auth.apiValue!,
  };
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getStatusCodeColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return '#22c55e'; // success
  if (statusCode >= 300 && statusCode < 400) return '#3b82f6'; // info
  if (statusCode >= 400 && statusCode < 500) return '#f97316'; // warning
  return '#ef4444'; // danger
};

export const getStatusCodeText = (statusCode: number): string => {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return statusTexts[statusCode] || 'Unknown';
};
