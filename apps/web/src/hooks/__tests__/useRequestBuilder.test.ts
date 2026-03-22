import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRequestBuilder } from '../useRequestBuilder';

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
});
