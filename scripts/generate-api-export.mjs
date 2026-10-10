import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Run: node scripts/generate-api-export.mjs
// This is Apico's own export format, accepted by the Collections > Import control.
const output = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'apico-all-apis.apico_import.json');
const groups = [];
const json = (value) => JSON.stringify(value, null, 2);
const addGroup = (name, entries) => groups.push({ name, entries });
const e = (method, path, name, body) => ({ method, path, name, body });

addGroup('01 - Health and Auth', [
  e('GET', '/health', 'Health check'),
  e('POST', '/auth/register', 'Register', { name: 'Demo User', email: '{{USER_EMAIL}}', password: '{{USER_PASSWORD}}' }),
  e('POST', '/auth/login', 'Login', { email: '{{USER_EMAIL}}', password: '{{USER_PASSWORD}}' }),
  e('POST', '/auth/refresh', 'Refresh access token', { refreshToken: '{{REFRESH_TOKEN}}' }),
  e('POST', '/auth/logout', 'Logout'),
]);

addGroup('02 - Workspaces', [
  e('POST', '/workspaces', 'Create workspace', { name: 'API Demo' }),
  e('GET', '/workspaces', 'List my workspaces'),
  e('GET', '/workspaces/{{WORKSPACE_ID}}', 'Get workspace'),
  e('POST', '/workspaces/{{WORKSPACE_ID}}/invite', 'Invite member', { email: '{{INVITEE_EMAIL}}', role: 'VIEWER' }),
  e('GET', '/workspaces/{{WORKSPACE_ID}}/members', 'List members'),
  e('GET', '/workspaces/{{WORKSPACE_ID}}/invites', 'List pending workspace invites'),
  e('POST', '/workspaces/{{WORKSPACE_ID}}/invites/{{INVITE_ID}}/revoke', 'Revoke invite'),
  e('DELETE', '/workspaces/{{WORKSPACE_ID}}/members/{{USER_ID}}', 'Remove member'),
  e('PATCH', '/workspaces/{{WORKSPACE_ID}}/members/{{USER_ID}}', 'Change member role', { role: 'EDITOR' }),
  e('POST', '/workspaces/{{WORKSPACE_ID}}/leave', 'Leave workspace'),
  e('POST', '/workspaces/{{WORKSPACE_ID}}/import', 'Import Apico data', { format: 'apico', version: 1, collections: [], requests: [] }),
  e('DELETE', '/workspaces/{{WORKSPACE_ID}}/clear-data', 'Clear workspace data [DESTRUCTIVE]'),
]);

addGroup('03 - Workspace Invites', [
  e('GET', '/workspace-invites/pending', 'My pending invites'),
  e('GET', '/workspace-invites/{{INVITE_TOKEN}}', 'Preview invite'),
  e('POST', '/workspace-invites/{{INVITE_TOKEN}}/accept', 'Accept invite'),
  e('POST', '/workspace-invites/{{INVITE_TOKEN}}/decline', 'Decline invite'),
]);

addGroup('04 - Collections', [
  e('POST', '/workspaces/{{WORKSPACE_ID}}/collections', 'Create collection', { name: 'Users API' }),
  e('GET', '/workspaces/{{WORKSPACE_ID}}/collections', 'List collections'),
  e('PATCH', '/collections/reorder', 'Reorder collections', { items: [{ id: '{{COLLECTION_ID}}', order: 0 }] }),
  e('PUT', '/collections/{{COLLECTION_ID}}', 'Update collection', { name: 'Users API Updated' }),
  e('DELETE', '/collections/{{COLLECTION_ID}}', 'Delete collection [DESTRUCTIVE]'),
  e('POST', '/collections/{{COLLECTION_ID}}/share', 'Share collection', {}),
  e('GET', '/collections/share/{{SHARE_TOKEN}}', 'Get shared collection'),
]);

addGroup('05 - Folders', [
  e('POST', '/workspaces/{{WORKSPACE_ID}}/folders', 'Create folder', { name: 'Users' }),
  e('GET', '/workspaces/{{WORKSPACE_ID}}/folders', 'List folders'),
  e('PATCH', '/workspaces/{{WORKSPACE_ID}}/folders/reorder', 'Reorder folders', { items: [{ id: '{{FOLDER_ID}}', order: 0 }] }),
  e('PUT', '/workspaces/{{WORKSPACE_ID}}/folders/{{FOLDER_ID}}', 'Update folder', { name: 'Users Updated' }),
  e('DELETE', '/workspaces/{{WORKSPACE_ID}}/folders/{{FOLDER_ID}}', 'Delete folder [DESTRUCTIVE]'),
]);

addGroup('06 - Environments', [
  e('POST', '/workspaces/{{WORKSPACE_ID}}/environments', 'Create environment', { name: 'Local' }),
  e('GET', '/workspaces/{{WORKSPACE_ID}}/environments', 'List environments'),
  e('GET', '/environments/{{ENVIRONMENT_ID}}', 'Get environment'),
  e('PUT', '/environments/{{ENVIRONMENT_ID}}', 'Update environment', { name: 'Development' }),
  e('DELETE', '/environments/{{ENVIRONMENT_ID}}', 'Delete environment [DESTRUCTIVE]'),
  e('PUT', '/environments/{{ENVIRONMENT_ID}}/variables', 'Replace environment variables', { variables: [{ key: 'SERVICE_URL', value: 'https://example.com', enabled: true, isSecret: false }] }),
]);

addGroup('07 - Tags', [
  e('GET', '/workspaces/{{WORKSPACE_ID}}/tags', 'List tags'),
  e('POST', '/workspaces/{{WORKSPACE_ID}}/tags', 'Create tag', { name: 'smoke' }),
  e('PUT', '/workspaces/{{WORKSPACE_ID}}/tags/{{TAG_ID}}', 'Update tag', { name: 'regression' }),
  e('DELETE', '/workspaces/{{WORKSPACE_ID}}/tags/{{TAG_ID}}', 'Delete tag [DESTRUCTIVE]'),
]);

addGroup('08 - Requests', [
  e('POST', '/requests/execute', 'Execute HTTP request', { method: 'GET', url: 'https://example.com', headers: [], params: [], auth: { type: 'none' } }),
  e('GET', '/requests/share/{{SHARE_TOKEN}}', 'Get shared request'),
  e('GET', '/requests/search?workspaceId={{WORKSPACE_ID}}&q=user', 'Search requests'),
  e('PATCH', '/requests/reorder', 'Reorder requests', { items: [{ id: '{{REQUEST_ID}}', order: 0 }] }),
  e('POST', '/requests/{{COLLECTION_ID}}/requests', 'Save request', { name: 'Example GET', method: 'GET', url: 'https://example.com', headers: [], params: [], auth: { type: 'none' } }),
  e('GET', '/requests/{{COLLECTION_ID}}/requests', 'List saved requests'),
  e('PUT', '/requests/{{REQUEST_ID}}', 'Update saved request', { name: 'Example GET Updated' }),
  e('PUT', '/requests/{{REQUEST_ID}}/tags', 'Set request tags', { tags: ['smoke'] }),
  e('DELETE', '/requests/{{REQUEST_ID}}', 'Delete saved request [DESTRUCTIVE]'),
  e('POST', '/requests/{{REQUEST_ID}}/share', 'Share request', {}),
]);

addGroup('09 - History', [
  e('GET', '/history?page=1&limit=50', 'List my history'),
  e('DELETE', '/history/{{HISTORY_ID}}', 'Delete history entry [DESTRUCTIVE]'),
  e('DELETE', '/history', 'Clear history [DESTRUCTIVE]'),
]);

addGroup('10 - gRPC', [
  e('POST', '/grpc/call', 'Call unary gRPC method', {
    target: 'localhost:50051',
    tls: false,
    proto: 'syntax = "proto3"; package example; service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); } message HelloRequest { string name = 1; } message HelloReply { string message = 1; }',
    service: 'example.Greeter',
    method: 'SayHello',
    message: { name: 'Apico' },
    metadata: {},
  }),
]);

const publicPaths = new Set([
  '/health', '/auth/register', '/auth/login', '/auth/refresh', '/auth/logout',
  '/workspace-invites/{{INVITE_TOKEN}}', '/collections/share/{{SHARE_TOKEN}}',
  '/requests/share/{{SHARE_TOKEN}}', '/requests/execute',
]);

const collections = groups.map((group, order) => ({ id: `api-${order + 1}`, name: group.name, order }));
const requests = groups.flatMap((group, groupIndex) => group.entries.map((entry, order) => ({
  id: `api-${groupIndex + 1}-${order + 1}`,
  name: `${entry.method} ${entry.name}`,
  collectionId: `api-${groupIndex + 1}`,
  method: entry.method,
  url: `{{BASE_URL}}${entry.path}`,
  headers: entry.body === undefined ? [] : [{ key: 'Content-Type', value: 'application/json', enabled: true }],
  params: [],
  ...(entry.body === undefined ? {} : { body: json(entry.body) }),
  auth: publicPaths.has(entry.path) ? { type: 'none' } : { type: 'bearer', token: '{{ACCESS_TOKEN}}' },
  order,
})));

if (requests.length !== 57) throw new Error(`Expected 57 route definitions, got ${requests.length}`);

// Catch omissions when API routes change. Routers mounted in two places use the
// workspace-qualified create/list paths and the short paths for ID operations.
const routeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'api', 'src', 'routes');
const mounts = {
  auth: '/auth', workspace: '/workspaces', workspaceInvite: '/workspace-invites',
  collection: '/collections', folder: '/workspaces/:workspaceId/folders',
  environment: '/environments', tag: '/workspaces/:workspaceId/tags',
  request: '/requests', history: '/history', grpc: '/grpc',
};
const normalize = (method, path) => `${method} ${path.split('?')[0]
  .replace(/\{\{[^}]+\}\}/g, '*')
  .replace(/:[^/]+/g, '*')
  .replace(/\/$/, '') || '/'}`;
const sourceRoutes = new Set([normalize('GET', '/health')]);
for (const [file, mount] of Object.entries(mounts)) {
  const source = readFileSync(resolve(routeRoot, `${file}.routes.ts`), 'utf8');
  for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'/g)) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const useWorkspacePath = (file === 'collection' || file === 'environment') && routePath === '/' && (method === 'GET' || method === 'POST');
    const prefix = useWorkspacePath ? `/workspaces/:workspaceId/${file === 'collection' ? 'collections' : 'environments'}` : mount;
    sourceRoutes.add(normalize(method, `${prefix}${routePath === '/' ? '' : routePath}`));
  }
}
const exportRoutes = new Set(groups.flatMap((group) => group.entries.map((entry) => normalize(entry.method, entry.path))));
const missing = [...sourceRoutes].filter((route) => !exportRoutes.has(route));
const extra = [...exportRoutes].filter((route) => !sourceRoutes.has(route));
if (missing.length || extra.length) throw new Error(`Route mismatch\nMissing: ${missing.join(', ')}\nExtra: ${extra.join(', ')}`);

writeFileSync(output, `${json({
  format: 'apico', version: 1, exportedAt: new Date().toISOString(),
  folders: [], collections, requests, tags: [],
})}\n`, 'utf8');
console.log(`Wrote ${requests.length} requests across ${collections.length} collections to ${output}`);
