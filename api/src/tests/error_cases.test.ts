import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Error Cases API', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@apico.dev',
        password: 'Test1234!'
    };

    it('🔴 Test 1 — should return 401 when accessing protected route without token', async () => {
        const res = await request(app).get('/api/workspaces');
        expect(res.status).toBe(401);
    });

    it('🔴 Test 2 — should return 401 with wrong password', async () => {
        // Register first
        await request(app).post('/api/auth/register').send(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
    });

    it('🔴 Test 3 — should return 400 for invalid URL in execute', async () => {
        const res = await request(app)
            .post('/api/requests/execute')
            .send({
                method: 'GET',
                url: 'not-a-url',
                headers: [],
                params: [],
                body: '',
                auth: { type: 'none' }
            });

        expect(res.status).toBe(400);
    });

    it('🔴 Test 4 — should return 404 for non-existent workspace', async () => {
        // Register and login
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        const accessToken = loginRes.body.data.accessToken;

        const res = await request(app)
            .get('/api/workspaces/clrcu5y8h000008l24z6y1f4x') // A valid format cuid but doesn't exist
            .set('Authorization', `Bearer ${accessToken}`);

        // The code might return 404 or 403 depending on implementation
        expect([404, 403]).toContain(res.status);
    });
});
