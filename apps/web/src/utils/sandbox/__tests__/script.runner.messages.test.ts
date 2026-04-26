import { describe, it, expect } from 'vitest';
import { isSandboxResultMessage } from '../script.runner';

describe('isSandboxResultMessage', () => {
  it('accepts a valid SCRIPT_RESULT message', () => {
    const message = {
      type: 'SCRIPT_RESULT',
      requestId: 'req_1',
      result: {
        request: {
          method: 'GET',
          url: 'https://example.com',
          headers: [],
          params: [],
          body: '',
        },
        variables: { token: 'abc' },
        logs: [{ type: 'log', message: 'hello', timestamp: 1 }],
        error: null,
      },
    };

    expect(isSandboxResultMessage(message)).toBe(true);
  });

  it('accepts a valid TEST_SCRIPT_RESULT message', () => {
    const message = {
      type: 'TEST_SCRIPT_RESULT',
      requestId: 'req_2',
      result: {
        request: {
          method: 'GET',
          url: 'https://example.com',
          headers: [],
          params: [],
          body: '',
        },
        variables: {},
        logs: [],
        error: null,
        tests: [],
        testsPassed: 0,
        testsFailed: 0,
      },
    };

    expect(isSandboxResultMessage(message)).toBe(true);
  });

  it('rejects messages with wrong shape', () => {
    expect(isSandboxResultMessage(null)).toBe(false);
    expect(isSandboxResultMessage({ type: 'SCRIPT_RESULT' })).toBe(false);
    expect(isSandboxResultMessage({ type: 'SCRIPT_RESULT', requestId: 'x', result: {} })).toBe(false);
    expect(isSandboxResultMessage({ type: 'NOPE', requestId: 'x', result: {} })).toBe(false);
  });
});

