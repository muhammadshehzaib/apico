import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Workspace & Collection API', () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 1000);
    let testUser = {
        name: 'Test User',
        email: '',
        password: 'Test1234!'
    };

    let accessToken: string;
    let workspaceId: string;
    let collectionId: string;

    const setupAuth = async () => {
        const uniqueId = Math.random().toString(36).substring(7);
        testUser.email = `workspace_test_${uniqueId}@apico.dev`;

        const registerRes = await request(app).post('/api/auth/register').send(testUser);
        expect(registerRes.status, `Registration failed: ${JSON.stringify(registerRes.body)}`).toBe(201);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        expect(loginRes.status, `Login failed: ${JSON.stringify(loginRes.body)}`).toBe(200);
        accessToken = loginRes.body.data.accessToken;
    };

    it('🟡 STEP 3 — should create a workspace', async () => {
        await setupAuth();

        const res = await request(app)
            .post('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Workspace' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        workspaceId = res.body.data.id;
    });

    it('🟡 STEP 4 — should get workspaces', async () => {
        await setupAuth();
        // Create one workspace
        const createRes = await request(app)
            .post('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Workspace' });
        workspaceId = createRes.body.data.id;

        const res = await request(app)
            .get('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((w: any) => w.id === workspaceId)).toBe(true);
    });

    it('🟡 STEP 5 — should create a collection', async () => {
        await setupAuth();
        const createWRes = await request(app)
            .post('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Workspace' });
        workspaceId = createWRes.body.data.id;

        const res = await request(app)
            .post(`/api/workspaces/${workspaceId}/collections`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Collection' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        collectionId = res.body.data.id;
    });

    it('🟡 STEP 6 — should get collections', async () => {
        await setupAuth();
        const createWRes = await request(app)
            .post('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Workspace' });
        workspaceId = createWRes.body.data.id;

        const createCRes = await request(app)
            .post(`/api/workspaces/${workspaceId}/collections`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Collection' });
        collectionId = createCRes.body.data.id;

        const res = await request(app)
            .get(`/api/workspaces/${workspaceId}/collections`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((c: any) => c.id === collectionId)).toBe(true);
    });
});
