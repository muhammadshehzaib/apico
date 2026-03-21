import axios from 'axios';
import { ExecuteRequestPayload, ExecuteRequestResult } from '../types';

export const executeRequest = async (payload: ExecuteRequestPayload): Promise<ExecuteRequestResult> => {
  const startTime = Date.now();

  const headers: Record<string, string> = {};
  const params: Record<string, string> = {};

  payload.headers.forEach((h) => {
    if (h.enabled) {
      headers[h.key] = h.value;
    }
  });

  payload.params.forEach((p) => {
    if (p.enabled) {
      params[p.key] = p.value;
    }
  });

  if (payload.auth && payload.auth.type !== 'none') {
    switch (payload.auth.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${payload.auth.token}`;
        break;
      case 'basic':
        const credentials = Buffer.from(
          `${payload.auth.username}:${payload.auth.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'apikey':
        if (payload.auth.apiIn === 'query') {
          params[payload.auth.apiKey!] = payload.auth.apiValue!;
        } else {
          headers[payload.auth.apiKey!] = payload.auth.apiValue!;
        }
        break;
    }
  }

  let requestBody: any = payload.body;

  // Auto-detect JSON body and set Content-Type if not already set
  if (payload.body && !headers['Content-Type'] && !headers['content-type']) {
    try {
      requestBody = JSON.parse(payload.body);
      headers['Content-Type'] = 'application/json';
    } catch {
      // Not JSON — send as plain string
    }
  }

  try {
    const response = await axios({
      method: payload.method.toLowerCase() as any,
      url: payload.url,
      headers,
      params,
      data: requestBody,
      timeout: 30000,
      validateStatus: () => true,
    });

    const duration = Date.now() - startTime;
    const responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const size = Buffer.byteLength(responseBody, 'utf8');

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | string[]>,
      body: responseBody,
      duration,
      size,
    };
  } catch (err: any) {
    if (err.response) {
      const duration = Date.now() - startTime;
      const responseBody = typeof err.response.data === 'string'
        ? err.response.data
        : JSON.stringify(err.response.data);
      const size = Buffer.byteLength(responseBody, 'utf8');

      return {
        statusCode: err.response.status,
        statusText: err.response.statusText,
        headers: err.response.headers as Record<string, string | string[]>,
        body: responseBody,
        duration,
        size,
      };
    }

    const duration = Date.now() - startTime;
    const errorMessage = err.code === 'ECONNABORTED'
      ? 'Request timeout (30s)'
      : err.message || 'Network error';

    const error = new Error(errorMessage);
    (error as any).statusCode = 500;
    throw error;
  }
};
