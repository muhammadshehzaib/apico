import type { PmContext, PmResult, PmTestResult, PmResponse } from './pm.context';

interface RunScriptOptions {
  script: string;
  pmContext: PmContext;
  timeout?: number;
}

interface RunTestScriptOptions extends RunScriptOptions {
  response: PmResponse;
}

interface PendingRequest {
  resolve: (result: PmResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
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
        resolve: resolve as any,
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
        resolve: resolve as any,
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

    const data = event.data as any;
    if (data?.type !== 'SCRIPT_RESULT' && data?.type !== 'TEST_SCRIPT_RESULT') return;

    const { requestId, result } = data;
    if (typeof requestId !== 'string') return;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) return;

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
