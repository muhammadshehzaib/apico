import { executeRequest } from '../proxy/executor';
import { HttpMethod, ExecuteRequestPayload } from '../types';
import { runPreRequestScript, runPostResponseScript, type TestResult } from './sandbox';
import type { CliRequest } from './loadCollection';

export type RunStatus = 'passed' | 'failed' | 'errored' | 'skipped';

export interface RequestRunResult {
  name: string;
  folderPath: string[];
  method: HttpMethod;
  url: string;
  status: RunStatus;
  statusCode?: number;
  duration?: number;
  errorMessage?: string;
  tests: TestResult[];
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  errored: number;
  skipped: number;
  totalTests: number;
  totalTestsPassed: number;
  totalTestsFailed: number;
  durationMs: number;
  results: RequestRunResult[];
}

export interface RunOptions {
  bail?: boolean;
  onProgress?: (result: RequestRunResult, index: number, total: number) => void;
}

const resolveVars = (text: string, vars: Record<string, string>): string => {
  if (!text) return text;
  return text.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const trimmed = name.trim();
    return Object.prototype.hasOwnProperty.call(vars, trimmed) ? vars[trimmed] : match;
  });
};

const buildPayload = (request: CliRequest, vars: Record<string, string>): ExecuteRequestPayload => {
  const auth = request.auth
    ? {
        ...request.auth,
        token: request.auth.token ? resolveVars(request.auth.token, vars) : request.auth.token,
        username: request.auth.username ? resolveVars(request.auth.username, vars) : request.auth.username,
        password: request.auth.password ? resolveVars(request.auth.password, vars) : request.auth.password,
        apiKey: request.auth.apiKey ? resolveVars(request.auth.apiKey, vars) : request.auth.apiKey,
        apiValue: request.auth.apiValue ? resolveVars(request.auth.apiValue, vars) : request.auth.apiValue,
      }
    : undefined;

  return {
    method: request.method,
    url: resolveVars(request.url, vars),
    headers: request.headers
      .filter((h) => h.enabled && h.key)
      .map((h) => ({ key: h.key, value: resolveVars(h.value, vars), enabled: true })),
    params: request.params
      .filter((p) => p.enabled && p.key)
      .map((p) => ({ key: p.key, value: resolveVars(p.value, vars), enabled: true })),
    body: request.body ? resolveVars(request.body, vars) : undefined,
    auth,
  };
};

export const runCollection = async (
  requests: CliRequest[],
  environment: Record<string, string>,
  options: RunOptions = {}
): Promise<RunSummary> => {
  const startedAt = Date.now();
  const vars: Record<string, string> = { ...environment };
  const results: RequestRunResult[] = [];

  let totalTests = 0;
  let totalTestsPassed = 0;
  let totalTestsFailed = 0;
  let bailOut = false;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];

    if (bailOut) {
      const skipped: RequestRunResult = {
        name: req.name,
        folderPath: req.folderPath,
        method: req.method,
        url: req.url,
        status: 'skipped',
        tests: [],
      };
      results.push(skipped);
      options.onProgress?.(skipped, i, requests.length);
      continue;
    }

    const result: RequestRunResult = {
      name: req.name,
      folderPath: req.folderPath,
      method: req.method,
      url: req.url,
      status: 'passed',
      tests: [],
    };

    try {
      let payload = buildPayload(req, vars);

      // Pre-request
      if (req.preRequestScript && req.preRequestScript.trim()) {
        const pre = await runPreRequestScript({
          script: req.preRequestScript,
          request: {
            method: payload.method,
            url: payload.url,
            headers: payload.headers.map((h) => ({ key: h.key, value: h.value })),
            params: payload.params.map((p) => ({ key: p.key, value: p.value })),
            body: payload.body || '',
          },
          variables: {},
          environment: vars,
          requestName: req.name,
        });

        if (pre.error) {
          throw new Error(`Pre-request script error: ${pre.error}`);
        }
        payload = {
          ...payload,
          url: pre.request.url,
          body: pre.request.body || undefined,
          headers: pre.request.headers.map((h) => ({ key: h.key, value: h.value, enabled: true })),
          params: pre.request.params.map((p) => ({ key: p.key, value: p.value, enabled: true })),
        };
        for (const [k, v] of Object.entries(pre.variables)) vars[k] = v;
      }

      // Execute
      const requestStart = Date.now();
      let response;
      try {
        response = await executeRequest(payload);
      } catch (err) {
        result.status = 'errored';
        result.errorMessage = err instanceof Error ? err.message : 'Network error';
        result.duration = Date.now() - requestStart;
        results.push(result);
        options.onProgress?.(result, i, requests.length);
        if (options.bail) bailOut = true;
        continue;
      }

      result.statusCode = response.statusCode;
      result.duration = response.duration ?? Date.now() - requestStart;

      // Post-response
      if (req.postResponseScript && req.postResponseScript.trim()) {
        const post = await runPostResponseScript({
          script: req.postResponseScript,
          request: {
            method: payload.method,
            url: payload.url,
            headers: payload.headers.map((h) => ({ key: h.key, value: h.value })),
            params: payload.params.map((p) => ({ key: p.key, value: p.value })),
            body: payload.body || '',
          },
          response: {
            statusCode: response.statusCode,
            statusText: response.statusText,
            headers: response.headers,
            body: response.body,
            duration: result.duration,
            size: response.size,
          },
          variables: {},
          environment: vars,
          requestName: req.name,
        });

        result.tests = post.tests;
        totalTests += post.tests.length;
        totalTestsPassed += post.testsPassed;
        totalTestsFailed += post.testsFailed;

        for (const [k, v] of Object.entries(post.variables)) vars[k] = v;

        if (post.error) {
          result.errorMessage = `Test script error: ${post.error}`;
          result.status = 'failed';
        } else if (post.testsFailed > 0) {
          result.status = 'failed';
        } else {
          result.status = 'passed';
        }
      } else {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          result.status = 'passed';
        } else {
          result.status = 'failed';
          result.errorMessage = `HTTP ${response.statusCode}`;
        }
      }
    } catch (err) {
      result.status = 'errored';
      result.errorMessage = err instanceof Error ? err.message : String(err);
    }

    results.push(result);
    options.onProgress?.(result, i, requests.length);

    if (options.bail && result.status !== 'passed') {
      bailOut = true;
    }
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const errored = results.filter((r) => r.status === 'errored').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  return {
    total: requests.length,
    passed,
    failed,
    errored,
    skipped,
    totalTests,
    totalTestsPassed,
    totalTestsFailed,
    durationMs: Date.now() - startedAt,
    results,
  };
};
