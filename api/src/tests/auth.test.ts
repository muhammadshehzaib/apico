import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Authentication API', () => {
    const timestamp = Date.now();
    const testUser = {
        name: 'Test User',
        email: `auth_test_${timestamp}@apico.dev`,
        password: 'Test1234!'
    };

    it('should register a new user', async () => {
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

    it('should login the user', async () => {
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

    it('should refresh the token', async () => {
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

    it('should logout the user', async () => {
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

    it('should reject weak passwords on registration', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test', email: 'weak@test.com', password: 'password' });

        expect(res.status).toBe(400);
    });

    it('should reject invalid credentials on login', async () => {
        await request(app).post('/api/auth/register').send(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'WrongPass1!' });

        expect(res.status).toBe(401);
    });
});
