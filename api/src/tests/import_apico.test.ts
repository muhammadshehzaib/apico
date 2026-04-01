import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Apico Import API', () => {
  const createUserAndWorkspace = async () => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Import User',
      email: `import_user_${uniqueId}@apico.dev`,
      password: 'Test1234!',
    };

    const registerRes = await request(app).post('/api/auth/register').send(user);
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.body.data.accessToken as string;

    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Import Workspace' });
    expect(workspaceRes.status).toBe(201);
    const workspaceId = workspaceRes.body.data.id as string;

    return { accessToken, workspaceId };
  };

  it('should import apico JSON and create folders, collections, requests, and tags', async () => {
    const { accessToken, workspaceId } = await createUserAndWorkspace();

    const payload = {
      format: 'apico',
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: [
        { id: 'f1', name: 'Root Folder', parentId: null, order: 1 },
        { id: 'f2', name: 'Child Folder', parentId: 'f1', order: 1 },
      ],
      collections: [
        { id: 'c1', name: 'Auth', folderId: 'f1', order: 1 },
        { id: 'c2', name: 'Nested', folderId: 'f2', order: 1 },
      ],
      requests: [
        {
          id: 'r1',
          name: 'Login',
          collectionId: 'c1',
          method: 'POST',
          url: 'https://example.com/login',
          headers: [],
          params: [],
          body: '',
          auth: { type: 'none' },
          order: 1,
          tags: [{ name: 'auth' }],
        },
        {
          id: 'r2',
          name: 'Me',
          collectionId: 'c2',
          method: 'GET',
          url: 'https://example.com/me',
          headers: [],
          params: [],
          order: 1,
          tags: [{ name: 'user' }, { name: 'auth' }],
        },
      ],
      tags: [{ name: 'auth' }, { name: 'user' }],
    };

    const importRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(importRes.status).toBe(201);
    expect(importRes.body.success).toBe(true);
    expect(importRes.body.data.foldersImported).toBe(2);
    expect(importRes.body.data.collectionsImported).toBe(2);
    expect(importRes.body.data.requestsImported).toBe(2);
    expect(importRes.body.data.tagsImported).toBe(2);

    const foldersRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/folders`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(foldersRes.status).toBe(200);
    expect(foldersRes.body.data.length).toBe(2);

    const collectionsRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/collections`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(collectionsRes.status).toBe(200);
    const collections = collectionsRes.body.data as any[];
    expect(collections.length).toBe(2);

    const authCollection = collections.find((c) => c.name === 'Auth');
    const nestedCollection = collections.find((c) => c.name === 'Nested');
    expect(authCollection).toBeDefined();
    expect(nestedCollection).toBeDefined();
    expect(nestedCollection.folderId).toBeTruthy();

    const authRequestsRes = await request(app)
      .get(`/api/requests/${authCollection.id}/requests`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(authRequestsRes.status).toBe(200);
    expect(authRequestsRes.body.data.length).toBe(1);
    expect(authRequestsRes.body.data[0].tags.map((t: any) => t.name)).toContain('auth');

    const nestedRequestsRes = await request(app)
      .get(`/api/requests/${nestedCollection.id}/requests`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(nestedRequestsRes.status).toBe(200);
    expect(nestedRequestsRes.body.data.length).toBe(1);
    const nestedTags = nestedRequestsRes.body.data[0].tags.map((t: any) => t.name);
    expect(nestedTags).toContain('user');
    expect(nestedTags).toContain('auth');

    const tagsRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/tags`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(tagsRes.status).toBe(200);
    const tagNames = tagsRes.body.data.map((t: any) => t.name);
    expect(tagNames).toContain('auth');
    expect(tagNames).toContain('user');
  });

  it('should reject import without auth', async () => {
    const payload = { format: 'apico', version: 1 };
    const res = await request(app).post('/api/workspaces/abc/import').send(payload);
    expect(res.status).toBe(401);
  });

  it('should reject invalid payload format', async () => {
    const { accessToken, workspaceId } = await createUserAndWorkspace();

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ format: 'invalid', version: 1 });

    expect(res.status).toBe(400);
  });

  it('should reject when request references unknown collection', async () => {
    const { accessToken, workspaceId } = await createUserAndWorkspace();

    const payload = {
      format: 'apico',
      version: 1,
      collections: [{ id: 'c1', name: 'Only', order: 1 }],
      requests: [
        {
          id: 'r1',
          name: 'Broken',
          collectionId: 'missing',
          method: 'GET',
          url: 'https://example.com',
          headers: [],
          params: [],
        },
      ],
    };

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });
});
