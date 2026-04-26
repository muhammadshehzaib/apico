import type { PmContext, PmResult, PmTestResult, PmResponse } from './pm.context';

export type SandboxResultMessage =
  | { type: 'SCRIPT_RESULT'; requestId: string; result: PmResult }
  | { type: 'TEST_SCRIPT_RESULT'; requestId: string; result: PmTestResult };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isConsoleLineArray = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every(
    (v) =>
      isRecord(v) &&
      typeof v.type === 'string' &&
      typeof v.message === 'string' &&
      typeof v.timestamp === 'number'
  );

const isPmRequestLike = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.method === 'string' &&
  typeof value.url === 'string' &&
  typeof value.body === 'string' &&
  Array.isArray(value.headers) &&
  Array.isArray(value.params);

const isVariablesLike = (value: unknown): boolean =>
  isRecord(value) && Object.values(value).every((v) => typeof v === 'string');

const isPmResultLike = (value: unknown): boolean =>
  isRecord(value) &&
  isPmRequestLike(value.request) &&
  isVariablesLike(value.variables) &&
  isConsoleLineArray(value.logs) &&
  (typeof value.error === 'string' || value.error === null);

const isPmTestResultLike = (value: unknown): boolean =>
  isPmResultLike(value) &&
  Array.isArray((value as Record<string, unknown>).tests) &&
  typeof (value as Record<string, unknown>).testsPassed === 'number' &&
  typeof (value as Record<string, unknown>).testsFailed === 'number';

export const isSandboxResultMessage = (data: unknown): data is SandboxResultMessage => {
  if (!isRecord(data)) return false;
  if (typeof data.type !== 'string' || typeof data.requestId !== 'string') return false;

  if (data.type === 'SCRIPT_RESULT') {
    return isPmResultLike(data.result);
  }

  if (data.type === 'TEST_SCRIPT_RESULT') {
    return isPmTestResultLike(data.result);
  }

  return false;
};

interface RunScriptOptions {
  script: string;
  pmContext: PmContext;
  timeout?: number;
}

interface RunTestScriptOptions extends RunScriptOptions {
  response: PmResponse;
}

interface PendingRequest {
  expectedType: SandboxResultMessage['type'];
  resolve: (result: PmResult | PmTestResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

class ScriptRunner {
  private iframe: HTMLIFrameElement | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private isInitialized = false;
  private readonly boundHandleMessage = (event: MessageEvent) => this.handleMessage(event);

  initialize(): void {
    if (this.isInitialized) return;

    try {
      // Create hidden iframe
      this.iframe = document.createElement('iframe');
      this.iframe.src = '/sandbox.html';
      this.iframe.style.display = 'none';
      if (this.iframe.sandbox && typeof this.iframe.sandbox.add === 'function') {
        this.iframe.sandbox.add('allow-scripts');
      } else {
        this.iframe.setAttribute('sandbox', 'allow-scripts');
      }

      // Add message listener
      window.addEventListener('message', this.boundHandleMessage);

      // Append to body
      document.body.appendChild(this.iframe);

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize script runner:', err);
    }
  }

  async runScript(options: RunScriptOptions): Promise<PmResult> {
    if (!this.isInitialized || !this.iframe?.contentWindow) {
      throw new Error('Script runner not initialized');
    }

    const timeout = options.timeout || 5000;
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Script timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(requestId, {
        expectedType: 'SCRIPT_RESULT',
        resolve: (result) => resolve(result as PmResult),
        reject,
        timeout: timeoutHandle,
      });

      // Send script to iframe
      this.iframe!.contentWindow!.postMessage(
        {
          type: 'RUN_SCRIPT',
          script: options.script,
          pmContext: options.pmContext,
          requestId,
        },
        window.location.origin
      );
    });
  }

  async runTestScript(options: RunTestScriptOptions): Promise<PmTestResult> {
    if (!this.isInitialized || !this.iframe?.contentWindow) {
      throw new Error('Script runner not initialized');
    }

    const timeout = options.timeout || 10000;
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Test script timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(requestId, {
        expectedType: 'TEST_SCRIPT_RESULT',
        resolve: (result) => resolve(result as PmTestResult),
        reject,
        timeout: timeoutHandle,
      });

      // Send test script to iframe
      this.iframe!.contentWindow!.postMessage(
        {
          type: 'RUN_TEST_SCRIPT',
          script: options.script,
          pmContext: {
            ...options.pmContext,
            response: options.response,
            eventName: 'test',
          },
          requestId,
        },
        window.location.origin
      );
    });
  }

  private handleMessage(event: MessageEvent): void {
    if (!this.iframe?.contentWindow) return;
    if (event.source !== this.iframe.contentWindow) return;
    if (event.origin !== window.location.origin) return;

    if (!isSandboxResultMessage(event.data)) return;

    const { requestId, result, type } = event.data;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) return;
    if (pending.expectedType !== type) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(requestId);

    pending.resolve(result);
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  destroy(): void {
    window.removeEventListener('message', this.boundHandleMessage);

    if (this.iframe?.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    this.iframe = null;
    this.isInitialized = false;

    // Reject all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Script runner destroyed'));
    }
    this.pendingRequests.clear();
  }
}

export const scriptRunner = new ScriptRunner();
