import { HttpMethod, KeyValuePair, RequestAuth } from '@/types';

export interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  auth: RequestAuth;
}

/**
 * Parses a curl command string into a structured request object.
 * Handles multiple formats: single-line, multi-line, short flags, long flags.
 */
export function parseCurl(curlString: string): ParsedCurl {
  // Step 1: Clean the input
  let cleaned = curlString.trim();

  // Remove leading $ (copy from terminal)
  if (cleaned.startsWith('$')) {
    cleaned = cleaned.substring(1).trim();
  }

  // Remove "curl" from the start
  if (cleaned.toLowerCase().startsWith('curl')) {
    cleaned = cleaned.substring(4).trim();
  }

  // Remove backslash line continuations
  cleaned = cleaned.replace(/\\\r\n/g, ' ').replace(/\\\n/g, ' ');

  // Normalize multiple spaces to single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    throw new Error('No URL found in curl command');
  }

  // Step 2: Extract METHOD
  let method = extractMethod(cleaned);

  // Step 3: Extract URL
  const url = extractUrl(cleaned);
  if (!url) {
    throw new Error('Could not parse URL from curl command');
  }

  // Step 4: Parse URL into base + params
  const { baseUrl, params } = parseUrlParams(url);

  // Step 5: Extract HEADERS
  let headers = extractHeaders(cleaned);

  // Step 6: Detect AUTH from headers and remove Authorization header
  let auth: RequestAuth = { type: 'none' };
  const authFromHeader = extractAuthFromHeader(headers);
  if (authFromHeader) {
    auth = authFromHeader;
    // Remove Authorization header from the list
    headers = headers.filter((h) => h.key.toLowerCase() !== 'authorization');
  }

  // Step 7: Detect AUTH from --user flag
  const authFromUser = extractAuthFromUser(cleaned);
  if (authFromUser) {
    auth = authFromUser;
  }

  // Step 8: Extract BODY
  const body = extractBody(cleaned);

  // If body is present and no explicit method set, default to POST
  if (!cleaned.includes('-X') && !cleaned.includes('--request') && body) {
    method = HttpMethod.POST;
  }

  return {
    method,
    url: baseUrl,
    headers: headers.length > 0 ? headers : [],
    params,
    body,
    auth,
  };
}

function extractMethod(curlString: string): HttpMethod {
  const shortMatch = curlString.match(/-X\s+(\w+)/i);
  if (shortMatch) {
    return normalizeMethod(shortMatch[1]);
  }

  const longMatch = curlString.match(/--request\s+(\w+)/i);
  if (longMatch) {
    return normalizeMethod(longMatch[1]);
  }

  return HttpMethod.GET;
}

function normalizeMethod(method: string): HttpMethod {
  const upper = method.toUpperCase();
  if (Object.values(HttpMethod).includes(upper as HttpMethod)) {
    return upper as HttpMethod;
  }
  return HttpMethod.GET;
}

function extractUrl(curlString: string): string | null {
  // Try --url flag first
  const urlFlagMatch = curlString.match(/--url\s+(['"]?)([^'"\s]+)\1/i);
  if (urlFlagMatch) {
    return urlFlagMatch[2];
  }

  // Find first http:// or https:// that's not after a flag
  const httpMatch = curlString.match(/(['"]?)(https?:\/\/[^\s'"]+)\1/);
  if (httpMatch) {
    return httpMatch[2];
  }

  return null;
}

function parseUrlParams(
  urlString: string
): { baseUrl: string; params: KeyValuePair[] } {
  try {
    const url = new URL(urlString);
    const baseUrl = url.origin + url.pathname;
    const params: KeyValuePair[] = [];

    url.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        enabled: true,
      });
    });

    return { baseUrl, params };
  } catch {
    // If URL parsing fails, return the URL as-is without params
    return { baseUrl: urlString, params: [] };
  }
}

function extractHeaders(curlString: string): KeyValuePair[] {
  const headers: KeyValuePair[] = [];
  const headerRegex = /(?:-H|--header)\s+(['"]?)([^'"]+?)\1/g;

  let match;
  while ((match = headerRegex.exec(curlString)) !== null) {
    const headerValue = match[2].trim();
    const colonIndex = headerValue.indexOf(':');

    if (colonIndex !== -1) {
      const key = headerValue.substring(0, colonIndex).trim();
      const value = headerValue.substring(colonIndex + 1).trim();

      headers.push({
        key,
        value,
        enabled: true,
      });
    }
  }

  return headers;
}

function extractAuthFromHeader(headers: KeyValuePair[]): RequestAuth | null {
  const authHeader = headers.find(
    (h) => h.key.toLowerCase() === 'authorization'
  );

  if (!authHeader) {
    return null;
  }

  const value = authHeader.value.trim();

  // Bearer token
  if (value.toLowerCase().startsWith('bearer ')) {
    const token = value.substring(7).trim();
    return { type: 'bearer', token };
  }

  // Basic auth
  if (value.toLowerCase().startsWith('basic ')) {
    const encoded = value.substring(6).trim();
    try {
      const decoded = atob(encoded);
      const colonIndex = decoded.indexOf(':');

      if (colonIndex !== -1) {
        const username = decoded.substring(0, colonIndex);
        const password = decoded.substring(colonIndex + 1);
        return { type: 'basic', username, password };
      }
    } catch {
      // If decoding fails, ignore
    }
  }

  return null;
}

function extractAuthFromUser(curlString: string): RequestAuth | null {
  // Look for -u or --user flag
  const userMatch = curlString.match(/(?:-u|--user)\s+(['"]?)([^'"]+?)\1/i);

  if (userMatch) {
    const credentials = userMatch[2].trim();
    const colonIndex = credentials.indexOf(':');

    if (colonIndex !== -1) {
      const username = credentials.substring(0, colonIndex);
      const password = credentials.substring(colonIndex + 1);
      return { type: 'basic', username, password };
    }
  }

  return null;
}

function extractBody(curlString: string): string {
  // Look for -d, --data, --data-raw, or --data-binary
  const dataRegex =
    /(?:-d|--data|--data-raw|--data-binary)\s+(['"]?)(.+?)\1(?:\s+-|$)/;

  const match = curlString.match(dataRegex);

  if (!match) {
    return '';
  }

  let body = match[2].trim();

  // Handle multiple -d flags by concatenating
  const multiDataRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(['"]?)(.+?)\1/g;
  const bodies: string[] = [];
  let multiMatch;

  while ((multiMatch = multiDataRegex.exec(curlString)) !== null) {
    bodies.push(multiMatch[2].trim());
  }

  if (bodies.length > 1) {
    body = bodies.join('');
  } else if (bodies.length === 1) {
    body = bodies[0];
  }

  // Try to format JSON if it looks like JSON
  if (body.startsWith('{') || body.startsWith('[')) {
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify(parsed, null, 2);
    } catch {
      // If JSON parsing fails, leave as-is
    }
  }

  return body;
}
