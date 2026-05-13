import { HttpMethod, type KeyValuePair, type RequestAuth } from '@/types';

export interface ParsedEndpoint {
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  auth?: RequestAuth;
  tag?: string;
  description?: string;
}

export interface ParsedOpenAPI {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
  tagCount: number;
}

const SUPPORTED_METHODS: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
];

export class OpenAPIParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAPIParseError';
  }
}

export function parseOpenAPI(input: string | object): ParsedOpenAPI {
  let spec: any;

  if (typeof input === 'string') {
    try {
      spec = JSON.parse(input);
    } catch {
      throw new OpenAPIParseError('Input is not valid JSON. YAML is not supported — convert to JSON first.');
    }
  } else {
    spec = input;
  }

  if (!spec || typeof spec !== 'object') {
    throw new OpenAPIParseError('Spec must be a JSON object.');
  }

  const isV3 = typeof spec.openapi === 'string' && spec.openapi.startsWith('3.');
  const isV2 = spec.swagger === '2.0';

  if (!isV3 && !isV2) {
    throw new OpenAPIParseError('Unsupported spec version. Expected OpenAPI 3.x or Swagger 2.0.');
  }

  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new OpenAPIParseError('Spec has no `paths` object — nothing to import.');
  }

  const title = spec.info?.title || 'Imported API';
  const version = spec.info?.version || '1.0.0';
  const baseUrl = extractBaseUrl(spec, isV3);
  const componentSchemas = isV3 ? (spec.components?.schemas || {}) : (spec.definitions || {});
  const securitySchemes = isV3
    ? (spec.components?.securitySchemes || {})
    : (spec.securityDefinitions || {});
  const globalSecurity: Array<Record<string, string[]>> = Array.isArray(spec.security) ? spec.security : [];

  const endpoints: ParsedEndpoint[] = [];
  const tagsSeen = new Set<string>();

  for (const [pathKey, pathItemRaw] of Object.entries(spec.paths)) {
    const pathItem = pathItemRaw as Record<string, any>;
    if (!pathItem || typeof pathItem !== 'object') continue;

    const pathLevelParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];

    for (const methodLower of Object.keys(pathItem)) {
      const method = methodLower.toUpperCase() as HttpMethod;
      if (!SUPPORTED_METHODS.includes(method)) continue;

      const op = pathItem[methodLower];
      if (!op || typeof op !== 'object') continue;

      const opParams = Array.isArray(op.parameters) ? op.parameters : [];
      const allParams = [...pathLevelParams, ...opParams];

      const queryParams: KeyValuePair[] = [];
      const headers: KeyValuePair[] = [];
      let resolvedPath = pathKey;

      for (const p of allParams) {
        const param = resolveRef(p, spec) || p;
        if (!param?.name || !param?.in) continue;

        if (param.in === 'query') {
          queryParams.push({
            key: param.name,
            value: typeof param.example !== 'undefined' ? String(param.example) : '',
            enabled: !!param.required,
          });
        } else if (param.in === 'header') {
          headers.push({
            key: param.name,
            value: typeof param.example !== 'undefined' ? String(param.example) : '',
            enabled: !!param.required,
          });
        } else if (param.in === 'path') {
          resolvedPath = resolvedPath.replace(
            `{${param.name}}`,
            `{{${param.name}}}`
          );
        }
      }

      const body = buildExampleBody(op, isV3, componentSchemas);
      if (body) {
        const hasContentType = headers.some((h) => h.key.toLowerCase() === 'content-type');
        if (!hasContentType) {
          headers.push({ key: 'Content-Type', value: 'application/json', enabled: true });
        }
      }

      const opSecurity: Array<Record<string, string[]>> = Array.isArray(op.security)
        ? op.security
        : globalSecurity;
      const auth = buildAuth(opSecurity, securitySchemes);

      const tag = Array.isArray(op.tags) && op.tags.length > 0 ? String(op.tags[0]) : undefined;
      if (tag) tagsSeen.add(tag);

      const url = joinUrl(baseUrl, resolvedPath);

      const name = op.summary?.trim()
        || op.operationId?.trim()
        || `${method} ${pathKey}`;

      endpoints.push({
        name,
        method,
        url,
        headers,
        params: queryParams,
        body,
        auth,
        tag,
        description: op.description?.trim() || undefined,
      });
    }
  }

  if (endpoints.length === 0) {
    throw new OpenAPIParseError('No supported endpoints found in spec.');
  }

  return {
    title,
    version,
    baseUrl,
    endpoints,
    tagCount: tagsSeen.size,
  };
}

function extractBaseUrl(spec: any, isV3: boolean): string {
  if (isV3) {
    const server = Array.isArray(spec.servers) ? spec.servers[0] : null;
    if (server?.url) {
      let url: string = server.url;
      if (server.variables && typeof server.variables === 'object') {
        for (const [name, def] of Object.entries<any>(server.variables)) {
          const def_ = def as { default?: string };
          if (def_?.default) {
            url = url.replace(`{${name}}`, def_.default);
          }
        }
      }
      return url.replace(/\/$/, '');
    }
    return '';
  }

  const scheme = Array.isArray(spec.schemes) && spec.schemes.length > 0 ? spec.schemes[0] : 'https';
  const host = spec.host || '';
  const basePath = spec.basePath || '';
  if (!host) return basePath.replace(/\/$/, '');
  return `${scheme}://${host}${basePath}`.replace(/\/$/, '');
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!base) return path.startsWith('/') ? `https://example.com${path}` : `https://example.com/${path}`;
  if (!path.startsWith('/')) path = '/' + path;
  return `${base}${path}`;
}

function resolveRef(obj: any, spec: any): any {
  if (!obj || typeof obj !== 'object' || typeof obj.$ref !== 'string') return null;
  const path = obj.$ref.replace(/^#\//, '').split('/');
  let cur: any = spec;
  for (const seg of path) {
    if (cur == null) return null;
    cur = cur[seg];
  }
  return cur;
}

function buildExampleBody(op: any, isV3: boolean, schemas: Record<string, any>): string | undefined {
  if (isV3) {
    const content = op.requestBody?.content;
    if (!content || typeof content !== 'object') return undefined;
    const json = content['application/json'];
    if (!json) return undefined;
    if (typeof json.example !== 'undefined') {
      return JSON.stringify(json.example, null, 2);
    }
    if (json.examples && typeof json.examples === 'object') {
      const first: any = Object.values(json.examples)[0];
      if (first?.value !== undefined) return JSON.stringify(first.value, null, 2);
    }
    if (json.schema) {
      const example = exampleFromSchema(json.schema, schemas, new Set());
      if (example !== undefined) return JSON.stringify(example, null, 2);
    }
    return undefined;
  }

  const bodyParam = Array.isArray(op.parameters)
    ? op.parameters.find((p: any) => p?.in === 'body')
    : null;
  if (!bodyParam?.schema) return undefined;
  const example = exampleFromSchema(bodyParam.schema, schemas, new Set());
  return example !== undefined ? JSON.stringify(example, null, 2) : undefined;
}

function exampleFromSchema(
  schema: any,
  schemas: Record<string, any>,
  seen: Set<string>
): any {
  if (!schema || typeof schema !== 'object') return undefined;

  if (typeof schema.$ref === 'string') {
    const refName = schema.$ref.replace(/^#\/components\/schemas\//, '').replace(/^#\/definitions\//, '');
    if (seen.has(refName)) return undefined;
    seen.add(refName);
    const target = schemas[refName];
    return target ? exampleFromSchema(target, schemas, seen) : undefined;
  }

  if (typeof schema.example !== 'undefined') return schema.example;
  if (typeof schema.default !== 'undefined') return schema.default;

  switch (schema.type) {
    case 'string':
      if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().slice(0, 10);
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      if (schema.items) {
        const inner = exampleFromSchema(schema.items, schemas, seen);
        return inner === undefined ? [] : [inner];
      }
      return [];
    case 'object':
    default: {
      const props = schema.properties || (schema.allOf ? mergeAllOf(schema.allOf, schemas, seen) : null);
      if (!props || typeof props !== 'object') return {};
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(props)) {
        const val = exampleFromSchema(v, schemas, new Set(seen));
        out[k] = val === undefined ? null : val;
      }
      return out;
    }
  }
}

function mergeAllOf(parts: any[], schemas: Record<string, any>, _seen: Set<string>): Record<string, any> {
  const merged: Record<string, any> = {};
  for (const p of parts) {
    const resolved = typeof p.$ref === 'string'
      ? schemas[p.$ref.replace(/^#\/components\/schemas\//, '').replace(/^#\/definitions\//, '')]
      : p;
    if (resolved?.properties) {
      Object.assign(merged, resolved.properties);
    }
  }
  return merged;
}

function buildAuth(
  security: Array<Record<string, string[]>>,
  schemes: Record<string, any>
): RequestAuth | undefined {
  if (!Array.isArray(security) || security.length === 0) return undefined;
  const first = security[0];
  if (!first || typeof first !== 'object') return undefined;
  const schemeName = Object.keys(first)[0];
  if (!schemeName) return undefined;
  const scheme = schemes[schemeName];
  if (!scheme) return undefined;

  if (scheme.type === 'http' && (scheme.scheme === 'bearer' || scheme.bearerFormat === 'JWT')) {
    return { type: 'bearer', token: '{{token}}' };
  }
  if (scheme.type === 'http' && scheme.scheme === 'basic') {
    return { type: 'basic', username: '', password: '' };
  }
  if (scheme.type === 'apiKey' || (scheme.type === 'apiKey' && scheme.in)) {
    return {
      type: 'apikey',
      apiKey: scheme.name || 'X-API-Key',
      apiValue: '',
      apiIn: scheme.in === 'query' ? 'query' : 'header',
    };
  }
  return undefined;
}
