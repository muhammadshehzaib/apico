import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Workspace Management API', () => {
  const createUser = async (
    overrides?: Partial<{ name: string; email: string; password: string }>
  ) => {
    const uniqueId = Math.random().toString(36).substring(2);
    const user = {
      name: 'Workspace User',
      email: `workspace_user_${uniqueId}@apico.dev`,
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
      accessToken: loginRes.body.data.accessToken as string,
    };
  };

  const createWorkspace = async (accessToken: string, name = 'Managed Workspace') => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  const inviteUser = async (
    ownerToken: string,
    workspaceId: string,
    email?: string,
    role: 'OWNER' | 'EDITOR' | 'VIEWER' = 'VIEWER'
  ) => {
    const inviteEmail = email || `invite_${Math.random().toString(36).substring(2)}@apico.dev`;
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteEmail, role });
    expect(res.status).toBe(201);
    return {
      inviteEmail,
      inviteId: res.body.data.invite.id as string,
      token: res.body.data.invite.token as string,
    };
  };

  it('should fetch a workspace by id', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(workspaceId);
  });

  it('should list workspace members', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((m: any) => m.user?.email === owner.user.email)).toBe(true);
  });

  it('should list pending invites for a workspace', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((i: any) => i.id === invite.inviteId)).toBe(true);
  });

  it('should revoke a pending invite', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId);

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invites/${invite.inviteId}/revoke`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should update a member role', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId, undefined, 'EDITOR');

    const member = await createUser({ email: invite.inviteEmail, name: 'Member User' });
    const acceptRes = await request(app)
      .post(`/api/workspace-invites/${invite.token}/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const memberId = acceptRes.body.data.userId as string;

    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ role: 'VIEWER' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('VIEWER');
  });

  it('should remove a member', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId, undefined, 'VIEWER');

    const member = await createUser({ email: invite.inviteEmail, name: 'Member User' });
    const acceptRes = await request(app)
      .post(`/api/workspace-invites/${invite.token}/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const memberId = acceptRes.body.data.userId as string;

    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should allow a non-owner to leave a workspace', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId, undefined, 'VIEWER');

    const member = await createUser({ email: invite.inviteEmail, name: 'Member User' });
    const acceptRes = await request(app)
      .post(`/api/workspace-invites/${invite.token}/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/leave`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should list pending invites for the invited user', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId);

    const invitee = await createUser({ email: invite.inviteEmail, name: 'Invitee User' });
    const res = await request(app)
      .get('/api/workspace-invites/pending')
      .set('Authorization', `Bearer ${invitee.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((i: any) => i.token === invite.token)).toBe(true);
  });

  it('should allow an invited user to decline an invite', async () => {
    const owner = await createUser({ name: 'Owner User' });
    const workspaceId = await createWorkspace(owner.accessToken);
    const invite = await inviteUser(owner.accessToken, workspaceId);

    const invitee = await createUser({ email: invite.inviteEmail, name: 'Invitee User' });
    const res = await request(app)
      .post(`/api/workspace-invites/${invite.token}/decline`)
      .set('Authorization', `Bearer ${invitee.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
