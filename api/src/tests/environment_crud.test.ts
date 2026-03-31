import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Environment CRUD API', () => {
  const createUser = async () => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Env User',
      email: `env_user_${uniqueId}@apico.dev`,
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
      user,
      accessToken: loginRes.body.data.accessToken as string,
    };
  };

  const createWorkspace = async (accessToken: string) => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Env Workspace' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  const createEnvironment = async (accessToken: string, workspaceId: string) => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/environments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Env One' });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  it('should list environments for a workspace', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/environments`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((e: any) => e.id === envId)).toBe(true);
  });

  it('should fetch an environment by id', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .get(`/api/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(envId);
  });

  it('should fetch an environment by id via workspace route', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(envId);
  });

  it('should update an environment name', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .put(`/api/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Env Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Env Updated');
  });

  it('should update an environment name via workspace route', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Env Updated (Workspace Route)' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Env Updated (Workspace Route)');
  });

  it('should delete an environment', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .delete(`/api/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should delete an environment via workspace route', async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace(owner.accessToken);
    const envId = await createEnvironment(owner.accessToken, workspaceId);

    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/environments/${envId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject creating environment without workspaceId on base route', async () => {
    const owner = await createUser();

    const res = await request(app)
      .post('/api/environments')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Env Base Route' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should reject listing environments without workspaceId on base route', async () => {
    const owner = await createUser();

    const res = await request(app)
      .get('/api/environments')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
