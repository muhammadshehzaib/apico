import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock Auth Login
    http.post('*/api/auth/login', () => {
        return HttpResponse.json({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
                id: 'mock-user-id',
                email: 'test@apico.dev',
                name: 'Test User',
            },
        }, { status: 200 });
    }),

    // Mock Execute Request
    http.post('*/api/requests/execute', () => {
        return HttpResponse.json({
            success: true,
            data: {
                statusCode: 200,
                statusText: 'OK',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ message: 'Hello from mock!' }),
                duration: 120,
                size: 1024,
            },
        }, { status: 200 });
    }),

    // Add more handlers as needed
];
