import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScriptRunner } from '../useScriptRunner';
import type { ExecuteRequestInput } from '@/validations/request.validation';

const mockedRunner = vi.hoisted(() => ({
  initialize: vi.fn(),
  destroy: vi.fn(),
  runScript: vi.fn(),
  runTestScript: vi.fn(),
}));

vi.mock('@/utils/sandbox/script.runner', async (importActual) => {
  const actual = await importActual<typeof import('@/utils/sandbox/script.runner')>();
  return {
    ...actual,
    scriptRunner: mockedRunner,
  };
});

describe('useScriptRunner', () => {
  beforeEach(() => {
    mockedRunner.runScript.mockReset();
    mockedRunner.runTestScript.mockReset();
  });

  it('rejects invalid request mutations from pre-request script', async () => {
    const baseRequest: ExecuteRequestInput = {
      method: 'GET',
      url: 'https://example.com',
      headers: [{ key: 'x', value: '1', enabled: true }],
      params: [],
      body: '',
      auth: { type: 'none' },
    };

    mockedRunner.runScript.mockResolvedValue({
      request: { method: 'GET', url: 'not-a-url', headers: [], params: [], body: '' },
      variables: {},
      logs: [],
      error: null,
    });

    const { result } = renderHook(() => useScriptRunner('pm.request.url = "not-a-url"'));

    let output: { request: ExecuteRequestInput; variables: Record<string, string> } | undefined;
    await act(async () => {
      output = await result.current.runPreRequestScript(baseRequest, [], {});
    });

    expect(output!.request.url).toBe('https://example.com');
    expect(result.current.scriptError).toBe('Invalid URL');
  });

  it('applies valid request mutations and returns runtime variables', async () => {
    const baseRequest: ExecuteRequestInput = {
      method: 'GET',
      url: 'https://example.com',
      headers: [{ key: 'x', value: '1', enabled: true }],
      params: [],
      body: '',
      auth: { type: 'none' },
    };

    mockedRunner.runScript.mockResolvedValue({
      request: {
        method: 'GET',
        url: 'https://example.com',
        headers: [
          { key: 'x', value: '2' },
          { key: 'new', value: 'v' },
        ],
        params: [],
        body: 'changed',
      },
      variables: { token: 'abc', bad: 123 },
      logs: [],
      error: null,
    });

    const { result } = renderHook(() => useScriptRunner('pm.request.headers.add({key:"new", value:"v"})'));

    let output: { request: ExecuteRequestInput; variables: Record<string, string> } | undefined;
    await act(async () => {
      output = await result.current.runPreRequestScript(baseRequest, [], { existing: '1' });
    });

    expect(output!.request.body).toBe('changed');
    expect(output!.request.headers.find((h) => h.key === 'x')?.value).toBe('2');
    expect(output!.request.headers.find((h) => h.key === 'new')?.enabled).toBe(true);
    expect(output!.variables).toEqual({ token: 'abc' });
  });
});

