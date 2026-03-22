import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Execute, History & Sharing API', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@apico.dev',
        password: 'Test1234!'
    };

    let accessToken: string;
    let workspaceId: string;
    let collectionId: string;
    let requestId: string;
    let shareToken: string;

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

        const createCRes = await request(app)
            .post(`/api/workspaces/${workspaceId}/collections`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'My First Collection' });
        collectionId = createCRes.body.data.id;
    };

    it('🟢 STEP 7 — should execute a request with auth', async () => {
        await setupAuth();

        const res = await request(app)
            .post('/api/requests/execute')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.statusCode).toBe(200);
        expect(res.body.data.body).toBeDefined();
        expect(res.body.data.duration).toBeDefined();
        expect(res.body.data.size).toBeDefined();
    });

    it('🟢 STEP 8 — should execute a request without auth (guest)', async () => {
        const res = await request(app)
            .post('/api/requests/execute')
            .send({
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.statusCode).toBe(200);
    });

    it('🟢 STEP 9 — should save a request', async () => {
        await setupAuth();

        const res = await request(app)
            .post(`/api/requests/${collectionId}/requests`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Get Post by ID',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        requestId = res.body.data.id;
    });

    it('🟢 STEP 10 — should get saved requests', async () => {
        await setupAuth();
        // Save a request first
        const saveRes = await request(app)
            .post(`/api/requests/${collectionId}/requests`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Get Post by ID',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });
        requestId = saveRes.body.data.id;

        const res = await request(app)
            .get(`/api/requests/${collectionId}/requests`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((r: any) => r.id === requestId)).toBe(true);
    });

    it('🔵 STEP 11 — should get history', async () => {
        await setupAuth();
        // Execute a request with auth to create history
        await request(app)
            .post('/api/requests/execute')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });

        const res = await request(app)
            .get('/api/history')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('🔵 STEP 12 — should create a shared link', async () => {
        await setupAuth();
        // Save a request first
        const saveRes = await request(app)
            .post(`/api/requests/${collectionId}/requests`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Get Post by ID',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });
        requestId = saveRes.body.data.id;

        const res = await request(app)
            .post(`/api/requests/${requestId}/share`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        shareToken = res.body.data.token;
    });

    it('🔵 STEP 13 — should get a shared request publicly', async () => {
        await setupAuth();
        // Save a request
        const saveRes = await request(app)
            .post(`/api/requests/${collectionId}/requests`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Get Post by ID',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });
        requestId = saveRes.body.data.id;
        // Share it
        const shareRes = await request(app)
            .post(`/api/requests/${requestId}/share`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});
        shareToken = shareRes.body.data.token;

        const res = await request(app)
            .get(`/api/requests/share/${shareToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
    });
});
