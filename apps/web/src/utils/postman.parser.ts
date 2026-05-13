import { HttpMethod, type KeyValuePair, type RequestAuth } from '@/types';

export interface ParsedPostmanRequest {
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  auth?: RequestAuth;
  preRequestScript?: string;
  postResponseScript?: string;
  folderPath: string[];
}

export interface ParsedPostmanCollection {
  name: string;
  description?: string;
  requests: ParsedPostmanRequest[];
  folderCount: number;
}

const SUPPORTED_METHODS: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
];

export class PostmanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostmanParseError';
  }
}

export function parsePostman(input: string | object): ParsedPostmanCollection {
  let spec: any;

  if (typeof input === 'string') {
    try {
      spec = JSON.parse(input);
    } catch (err) {
      throw new PostmanParseError(`Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`);
    }
  } else {
    spec = input;
  }

  if (!spec || typeof spec !== 'object') {
    throw new PostmanParseError('Spec must be a JSON object.');
  }

  if (!spec.info || typeof spec.info !== 'object') {
    throw new PostmanParseError('Not a Postman collection — missing `info` block.');
  }

  const schema: string = spec.info.schema || '';
  if (!schema.includes('schema.getpostman.com')) {
    throw new PostmanParseError('Not a recognized Postman collection schema.');
  }

  const isV21 = schema.includes('v2.1.0');
  const isV20 = schema.includes('v2.0.0');
  if (!isV21 && !isV20) {
    throw new PostmanParseError('Unsupported Postman version. Expected v2.0.0 or v2.1.0.');
  }

  if (!Array.isArray(spec.item)) {
    throw new PostmanParseError('Collection has no `item` array — nothing to import.');
  }

  const requests: ParsedPostmanRequest[] = [];
  const folders = new Set<string>();

  walkItems(spec.item, [], spec, requests, folders);

  if (requests.length === 0) {
    throw new PostmanParseError('No requests found in collection.');
  }

  return {
    name: spec.info.name || 'Imported Collection',
    description: spec.info.description,
    requests,
    folderCount: folders.size,
  };
}

function walkItems(
  items: any[],
  folderPath: string[],
  collection: any,
  out: ParsedPostmanRequest[],
  folders: Set<string>
): void {
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    if (Array.isArray(item.item)) {
      const folderName = item.name || 'Folder';
      folders.add([...folderPath, folderName].join('/'));
      walkItems(item.item, [...folderPath, folderName], collection, out, folders);
      continue;
    }

    if (item.request) {
      const parsed = parseRequestItem(item, folderPath, collection);
      if (parsed) out.push(parsed);
    }
  }
}

function parseRequestItem(
  item: any,
  folderPath: string[],
  collection: any
): ParsedPostmanRequest | null {
  const req = item.request;
  if (!req) return null;

  const method = String(req.method || 'GET').toUpperCase() as HttpMethod;
  if (!SUPPORTED_METHODS.includes(method)) return null;

  const headers: KeyValuePair[] = parseHeaders(req.header);
  const url = parseUrl(req.url);
  const params: KeyValuePair[] = parseQuery(req.url);
  const body = parseBody(req.body);
  const auth = parseAuth(req.auth) || parseAuth(collection.auth);

  const { preRequestScript, postResponseScript } = parseEvents(item.event);

  return {
    name: item.name || `${method} ${url}`,
    method,
    url,
    headers,
    params,
    body,
    auth,
    preRequestScript: preRequestScript || undefined,
    postResponseScript: postResponseScript || undefined,
    folderPath,
  };
}

function parseHeaders(raw: any): KeyValuePair[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h === 'object' && typeof h.key === 'string')
    .map((h) => ({
      key: h.key,
      value: typeof h.value === 'string' ? h.value : String(h.value ?? ''),
      enabled: h.disabled !== true,
    }));
}

function parseUrl(raw: any): string {
  if (!raw) return 'https://example.com';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.raw === 'string' && raw.raw.length > 0) {
      // Strip query string — query lives in `params` separately
      const qIdx = raw.raw.indexOf('?');
      return qIdx >= 0 ? raw.raw.slice(0, qIdx) : raw.raw;
    }
    const protocol = raw.protocol || 'https';
    const host = Array.isArray(raw.host) ? raw.host.join('.') : (raw.host || '');
    const path = Array.isArray(raw.path) ? raw.path.join('/') : (raw.path || '');
    const port = raw.port ? `:${raw.port}` : '';
    return `${protocol}://${host}${port}/${path}`.replace(/\/+$/, '');
  }
  return 'https://example.com';
}

function parseQuery(raw: any): KeyValuePair[] {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.query)) return [];
  return raw.query
    .filter((q: any) => q && typeof q === 'object' && typeof q.key === 'string')
    .map((q: any) => ({
      key: q.key,
      value: typeof q.value === 'string' ? q.value : String(q.value ?? ''),
      enabled: q.disabled !== true,
    }));
}

function parseBody(raw: any): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  if (raw.disabled === true) return undefined;

  switch (raw.mode) {
    case 'raw':
      return typeof raw.raw === 'string' ? raw.raw : undefined;
    case 'urlencoded':
      if (Array.isArray(raw.urlencoded)) {
        return raw.urlencoded
          .filter((p: any) => p && typeof p.key === 'string' && p.disabled !== true)
          .map((p: any) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`)
          .join('&');
      }
      return undefined;
    case 'formdata':
      if (Array.isArray(raw.formdata)) {
        const fields = raw.formdata
          .filter((f: any) => f && typeof f.key === 'string' && f.disabled !== true)
          .map((f: any) => ({
            key: f.key,
            type: f.type === 'file' ? 'file' : 'text',
            value: typeof f.value === 'string' ? f.value : '',
            enabled: f.disabled !== true,
          }));
        return JSON.stringify({ __bodyType: 'form-data', fields });
      }
      return undefined;
    default:
      return undefined;
  }
}

function parseAuth(raw: any): RequestAuth | undefined {
  if (!raw || typeof raw !== 'object' || !raw.type) return undefined;
  const type: string = raw.type;
  const cfgArr = raw[type];

  // Postman v2.1 stores auth params as an array of { key, value, type } pairs
  const cfg: Record<string, string> = {};
  if (Array.isArray(cfgArr)) {
    for (const item of cfgArr) {
      if (item?.key) cfg[item.key] = String(item.value ?? '');
    }
  } else if (cfgArr && typeof cfgArr === 'object') {
    for (const [k, v] of Object.entries(cfgArr)) {
      cfg[k] = typeof v === 'string' ? v : String(v ?? '');
    }
  }

  switch (type) {
    case 'bearer':
      return { type: 'bearer', token: cfg.token || '' };
    case 'basic':
      return { type: 'basic', username: cfg.username || '', password: cfg.password || '' };
    case 'apikey':
      return {
        type: 'apikey',
        apiKey: cfg.key || 'X-API-Key',
        apiValue: cfg.value || '',
        apiIn: cfg.in === 'query' ? 'query' : 'header',
      };
    case 'noauth':
      return { type: 'none' };
    default:
      return undefined;
  }
}

function parseEvents(events: any): { preRequestScript: string; postResponseScript: string } {
  let preRequestScript = '';
  let postResponseScript = '';

  if (!Array.isArray(events)) return { preRequestScript, postResponseScript };

  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const exec = ev.script?.exec;
    const code = Array.isArray(exec) ? exec.join('\n') : (typeof exec === 'string' ? exec : '');
    if (!code.trim()) continue;

    if (ev.listen === 'prerequest') {
      preRequestScript = code;
    } else if (ev.listen === 'test') {
      postResponseScript = code;
    }
  }

  return { preRequestScript, postResponseScript };
}
