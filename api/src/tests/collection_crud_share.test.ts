import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Collection CRUD & Share API', () => {
  const createUser = async () => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Collection User',
      email: `collection_user_${uniqueId}@apico.dev`,
      password: 'Test1234!',
    };

    const registerRes = await request(app).post('/api/auth/register').send(user);
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(loginRes.status).toBe(200);

    return {
      accessToken: loginRes.body.data.accessToken as string,
    };
  };

  const createWorkspace = async (accessToken: string) => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Collection Workspace' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  const createCollection = async (accessToken: string, workspaceId: string) => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/collections`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Collection One' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  it('should update a collection', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const res = await request(app)
      .put(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Collection' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Collection');
  });

  it('should update a collection via workspace route', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Collection (Workspace Route)' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Collection (Workspace Route)');
  });

  it('should delete a collection', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const res = await request(app)
      .delete(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should delete a collection via workspace route', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should share a collection and fetch it publicly', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const shareRes = await request(app)
      .post(`/api/collections/${collectionId}/share`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(shareRes.status).toBe(201);
    const token = shareRes.body.data.token as string;

    const res = await request(app).get(`/api/collections/share/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(collectionId);
  });

  it('should share a collection via workspace route and fetch it publicly', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);

    const shareRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/collections/${collectionId}/share`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(shareRes.status).toBe(201);
    const token = shareRes.body.data.token as string;

    const res = await request(app).get(`/api/collections/share/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(collectionId);
  });

  it('should reject creating a collection without workspaceId on base route', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .post('/api/collections')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Base Collection' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should reject listing collections without workspaceId on base route', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .get('/api/collections')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
