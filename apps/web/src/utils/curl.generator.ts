import { HttpMethod, KeyValuePair, RequestAuth } from '@/types';

export interface CurlGeneratorInput {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  auth?: RequestAuth;
}

export function toCurl(request: CurlGeneratorInput): string {
  const parts: string[] = [`curl -X ${request.method}`];

  // Build the final URL with enabled query params
  let finalUrl = request.url;
  try {
    const urlObj = new URL(request.url);
    request.params
      .filter((p) => p.enabled && p.key)
      .forEach((p) => urlObj.searchParams.append(p.key, p.value));
    finalUrl = urlObj.toString();
  } catch {
    // If URL is invalid (e.g. still being typed), use as-is
  }

  // Auth headers — injected before user-defined headers so they can override
  const authHeaders = buildAuthHeaders(request.auth);
  authHeaders.forEach((h) => parts.push(`  -H '${escapeShellSingleQuote(h)}'`));

  // User-defined headers
  request.headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) =>
      parts.push(`  -H '${escapeShellSingleQuote(`${h.key}: ${h.value}`)}'`)
    );

  // Body
  if (request.body) {
    parts.push(`  -d '${escapeShellSingleQuote(request.body)}'`);
  }

  parts.push(`  '${escapeShellSingleQuote(finalUrl)}'`);

  return parts.join(' \\\n');
}

function buildAuthHeaders(auth?: RequestAuth): string[] {
  if (!auth || auth.type === 'none') return [];

  switch (auth.type) {
    case 'bearer':
      return auth.token ? [`Authorization: Bearer ${auth.token}`] : [];
    case 'basic': {
      const encoded = btoa(`${auth.username ?? ''}:${auth.password ?? ''}`);
      return [`Authorization: Basic ${encoded}`];
    }
    case 'apikey':
      if (auth.apiKey && auth.apiValue && auth.apiIn === 'header') {
        return [`${auth.apiKey}: ${auth.apiValue}`];
      }
      return [];
    default:
      return [];
  }
}

function escapeShellSingleQuote(str: string): string {
  return str.replace(/'/g, "'\\''");
}
