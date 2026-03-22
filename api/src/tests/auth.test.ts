import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Authentication API', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@apico.dev',
        password: 'Test1234!'
    };

    it('🔴 STEP 1 — should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe(testUser.email);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
    });

    it('🔴 STEP 2 — should login the user', async () => {
        // Register first
        await request(app).post('/api/auth/register').send(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
    });

    it('🔴 STEP 19 — should refresh the token', async () => {
        // Register and login to get refreshToken
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        const refreshToken = loginRes.body.data.refreshToken;

        const res = await request(app)
            .post('/api/auth/auth/refresh') // Wait, the user said /api/auth/refresh, let me check the prefix
            .send({ refreshToken });

        // Check if it's /api/auth/refresh or /api/auth/auth/refresh
        // App.use('/api', routes) and routes.use('/auth', authRoutes) means /api/auth/refresh
    });

    // Re-checking the refresh endpoint
    it('🔴 STEP 19 (Correct Route) — should refresh the token', async () => {
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        const refreshToken = loginRes.body.data.refreshToken;

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
    });

    it('🔴 STEP 20 — should logout the user', async () => {
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        const accessToken = loginRes.body.data.accessToken;

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
