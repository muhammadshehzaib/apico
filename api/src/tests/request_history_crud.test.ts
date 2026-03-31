import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Request Update/Delete & History Cleanup API', () => {
  const createUser = async () => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Request User',
      email: `request_user_${uniqueId}@apico.dev`,
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
      .send({ name: 'Request Workspace' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  const createCollection = async (accessToken: string, workspaceId: string) => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/collections`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Request Collection' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  const createSavedRequest = async (accessToken: string, collectionId: string) => {
    const res = await request(app)
      .post(`/api/requests/${collectionId}/requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Get Post',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: [],
        params: [],
        body: '',
        auth: { type: 'none' },
      });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  it('should update a saved request', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);
    const requestId = await createSavedRequest(accessToken, collectionId);

    const res = await request(app)
      .put(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Request Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Request Name');
  });

  it('should delete a saved request', async () => {
    const { accessToken } = await createUser();
    const workspaceId = await createWorkspace(accessToken);
    const collectionId = await createCollection(accessToken, workspaceId);
    const requestId = await createSavedRequest(accessToken, collectionId);

    const res = await request(app)
      .delete(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should delete a single history entry', async () => {
    const { accessToken } = await createUser();

    await request(app)
      .post('/api/requests/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: [],
        params: [],
        body: '',
        auth: { type: 'none' },
      });

    const listRes = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    const historyId = listRes.body.data[0]?.id as string;
    expect(historyId).toBeDefined();

    const res = await request(app)
      .delete(`/api/history/${historyId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should clear history entries', async () => {
    const { accessToken } = await createUser();

    await request(app)
      .post('/api/requests/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: [],
        params: [],
        body: '',
        auth: { type: 'none' },
      });

    const clearRes = await request(app)
      .delete('/api/history')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(0);
  });
});
