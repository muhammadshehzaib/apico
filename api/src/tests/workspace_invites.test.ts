import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Workspace Invites', () => {
  const createUser = async (overrides?: Partial<{ name: string; email: string; password: string }>) => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Invite User',
      email: `invite_${uniqueId}@apico.dev`,
      password: 'Test1234!',
      ...overrides,
    };

    const registerRes = await request(app).post('/api/auth/register').send(user);
    expect(registerRes.status, `Registration failed: ${JSON.stringify(registerRes.body)}`).toBe(201);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(loginRes.status, `Login failed: ${JSON.stringify(loginRes.body)}`).toBe(200);

    return {
      user,
      accessToken: loginRes.body.data.accessToken,
    };
  };

  it('should invite a user, fetch invite, and accept it', async () => {
    const owner = await createUser({ name: 'Owner User' });

    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Invite Workspace' });
    expect(workspaceRes.status).toBe(201);
    const workspaceId = workspaceRes.body.data.id;

    const inviteEmail = `invite_target_${Math.random().toString(36).substring(2)}@apico.dev`;
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: inviteEmail, role: 'VIEWER' });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.invite.token).toBeDefined();

    const token = inviteRes.body.data.invite.token as string;

    const inviteInfoRes = await request(app).get(`/api/workspace-invites/${token}`);
    expect(inviteInfoRes.status).toBe(200);
    expect(inviteInfoRes.body.data.workspace.id).toBe(workspaceId);

    const invitee = await createUser({ email: inviteEmail, name: 'Invitee User' });
    const acceptRes = await request(app)
      .post(`/api/workspace-invites/${token}/accept`)
      .set('Authorization', `Bearer ${invitee.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const workspacesRes = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${invitee.accessToken}`);
    expect(workspacesRes.status).toBe(200);
    expect(workspacesRes.body.data.some((w: any) => w.id === workspaceId)).toBe(true);

    const acceptAgainRes = await request(app)
      .post(`/api/workspace-invites/${token}/accept`)
      .set('Authorization', `Bearer ${invitee.accessToken}`);
    expect(acceptAgainRes.status).toBe(410);
  });

  it('should block VIEWER from write actions', async () => {
    const owner = await createUser({ name: 'Owner User' });

    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Role Workspace' });
    expect(workspaceRes.status).toBe(201);
    const workspaceId = workspaceRes.body.data.id;

    const inviteEmail = `viewer_${Math.random().toString(36).substring(2)}@apico.dev`;
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: inviteEmail, role: 'VIEWER' });
    expect(inviteRes.status).toBe(201);
    const token = inviteRes.body.data.invite.token as string;

    const viewer = await createUser({ email: inviteEmail, name: 'Viewer User' });
    const acceptRes = await request(app)
      .post(`/api/workspace-invites/${token}/accept`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const createCollectionRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/collections`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ name: 'Blocked Collection' });
    expect(createCollectionRes.status).toBe(403);

    const createEnvRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/environments`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ name: 'Blocked Env' });
    expect(createEnvRes.status).toBe(403);
  });
});
