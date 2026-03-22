import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Environment API', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@apico.dev',
        password: 'Test1234!'
    };

    let accessToken: string;
    let workspaceId: string;
    let environmentId: string;

    const setupAuth = async () => {
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        accessToken = loginRes.body.data.accessToken;

        const createWRes = await request(app)
            .post('/api/workspaces')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Workspace' });
        workspaceId = createWRes.body.data.id;
    };

    it('🟣 STEP 14 — should create an environment', async () => {
        await setupAuth();

        const res = await request(app)
            .post(`/api/workspaces/${workspaceId}/environments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Local Development' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        environmentId = res.body.data.id;
    });

    it('🟣 STEP 15 — should add variables to environment', async () => {
        await setupAuth();
        // Create environment
        const createERes = await request(app)
            .post(`/api/workspaces/${workspaceId}/environments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Local Development' });
        environmentId = createERes.body.data.id;

        const res = await request(app)
            .put(`/api/environments/${environmentId}/variables`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                variables: [
                    {
                        key: 'BASE_URL',
                        value: 'localhost:4000',
                        enabled: true,
                        isSecret: false
                    },
                    {
                        key: 'TOKEN',
                        value: 'my-secret-token',
                        enabled: true,
                        isSecret: true
                    }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);
    });
});
