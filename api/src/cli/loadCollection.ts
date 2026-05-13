import { readFileSync } from 'fs';
import { HttpMethod } from '../types';

export interface CliRequest {
  name: string;
  folderPath: string[];
  method: HttpMethod;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: string;
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiValue?: string;
    apiIn?: 'header' | 'query';
  };
  preRequestScript?: string;
  postResponseScript?: string;
}

export interface CliCollection {
  name: string;
  requests: CliRequest[];
}

const SUPPORTED: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
];

export const loadCollectionFromFile = (path: string): CliCollection => {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read collection file '${path}': ${err instanceof Error ? err.message : err}`);
  }

  let spec: any;
  try {
    spec = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Collection file is not valid JSON: ${err instanceof Error ? err.message : err}`);
  }

  if (!spec?.info || typeof spec.info !== 'object') {
    throw new Error('Not a Postman collection — missing `info` block.');
  }
  const schema: string = spec.info.schema || '';
  if (!schema.includes('schema.getpostman.com')) {
    throw new Error('Not a recognized Postman collection schema.');
  }

  const requests: CliRequest[] = [];
  walkItems(spec.item || [], [], spec, requests);

  if (requests.length === 0) {
    throw new Error('No requests found in collection.');
  }

  return {
    name: spec.info.name || 'Collection',
    requests,
  };
};

const walkItems = (items: any[], folderPath: string[], root: any, out: CliRequest[]) => {
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (Array.isArray(item.item)) {
      walkItems(item.item, [...folderPath, item.name || 'Folder'], root, out);
      continue;
    }
    if (!item.request) continue;
    const parsed = parseRequest(item, folderPath, root);
    if (parsed) out.push(parsed);
  }
};

const parseRequest = (item: any, folderPath: string[], root: any): CliRequest | null => {
  const req = item.request;
  const method = String(req.method || 'GET').toUpperCase() as HttpMethod;
  if (!SUPPORTED.includes(method)) return null;

  return {
    name: item.name || `${method} request`,
    folderPath,
    method,
    url: parseUrl(req.url),
    headers: parseHeaders(req.header),
    params: parseQuery(req.url),
    body: parseBody(req.body),
    auth: parseAuth(req.auth) || parseAuth(root.auth),
    ...parseEvents(item.event),
  };
};

const parseHeaders = (raw: any) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h.key === 'string')
    .map((h) => ({
      key: h.key,
      value: typeof h.value === 'string' ? h.value : String(h.value ?? ''),
      enabled: h.disabled !== true,
    }));
};

const parseQuery = (raw: any) => {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.query)) return [];
  return raw.query
    .filter((q: any) => q && typeof q.key === 'string')
    .map((q: any) => ({
      key: q.key,
      value: typeof q.value === 'string' ? q.value : String(q.value ?? ''),
      enabled: q.disabled !== true,
    }));
};

const parseUrl = (raw: any): string => {
  if (!raw) return 'https://example.com';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.raw === 'string' && raw.raw.length > 0) {
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
};

const parseBody = (raw: any): string | undefined => {
  if (!raw || typeof raw !== 'object' || raw.disabled === true) return undefined;
  switch (raw.mode) {
    case 'raw':
      return typeof raw.raw === 'string' ? raw.raw : undefined;
    case 'urlencoded':
      if (!Array.isArray(raw.urlencoded)) return undefined;
      return raw.urlencoded
        .filter((p: any) => p && typeof p.key === 'string' && p.disabled !== true)
        .map((p: any) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`)
        .join('&');
    default:
      return undefined;
  }
};

const parseAuth = (raw: any): CliRequest['auth'] => {
  if (!raw || typeof raw !== 'object' || !raw.type) return undefined;
  const type: string = raw.type;
  const cfgArr = raw[type];

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
};

const parseEvents = (events: any) => {
  let preRequestScript: string | undefined;
  let postResponseScript: string | undefined;
  if (!Array.isArray(events)) return { preRequestScript, postResponseScript };
  for (const ev of events) {
    const exec = ev?.script?.exec;
    const code = Array.isArray(exec) ? exec.join('\n') : (typeof exec === 'string' ? exec : '');
    if (!code.trim()) continue;
    if (ev.listen === 'prerequest') preRequestScript = code;
    else if (ev.listen === 'test') postResponseScript = code;
  }
  return { preRequestScript, postResponseScript };
};
