import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRequestBuilder } from '../useRequestBuilder';
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useRequestBuilder Hook', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useRequestBuilder());
        expect(result.current.url).toBe('');
        expect(result.current.method).toBe('GET');
        expect(result.current.isLoading).toBe(false);
    });

    it('should set URL and validate it', async () => {
        const { result } = renderHook(() => useRequestBuilder());

        act(() => {
            result.current.setUrl('invalid-url');
        });
        expect(result.current.url).toBe('invalid-url');

        await act(async () => {
            await result.current.sendRequest();
        });
        expect(result.current.urlError).toBe('Invalid URL');

        act(() => {
            result.current.setUrl('https://api.example.com');
        });
        await act(async () => {
            await result.current.sendRequest();
        });
        expect(result.current.urlError).toBeNull();
    });

    it('should execute request and receive mock response via MSW', async () => {
        const { result } = renderHook(() => useRequestBuilder());

        act(() => {
            result.current.setUrl('https://api.example.com');
        });

        await act(async () => {
            await result.current.sendRequest();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.response).not.toBeNull();
        expect(result.current.response?.statusCode).toBe(200);
        expect(JSON.parse(result.current.response?.body || '{}')).toEqual({ message: 'Hello from mock!' });
    });

    it('should resolve runtime variables from saved state when sending request', async () => {
        window.localStorage.setItem('apico_last_request', JSON.stringify({
            url: 'https://api.example.com?x={{token}}',
            runtimeVariables: { token: '123' },
        }));

        server.use(
            http.post('*/api/requests/execute', async ({ request }) => {
                const body = await request.json() as any;
                expect(body.url).toBe('https://api.example.com?x=123');

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
            })
        );

        const { result } = renderHook(() => useRequestBuilder());

        await waitFor(() => {
            expect(result.current.url).toBe('https://api.example.com?x={{token}}');
        });

        await act(async () => {
            await result.current.sendRequest();
        });

        expect(result.current.urlError).toBeNull();
        expect(result.current.response?.statusCode).toBe(200);
    });
});
