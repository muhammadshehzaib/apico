'use client';

import { useCallback, useRef, useState } from 'react';
import { scriptRunner } from '@/utils/sandbox/script.runner';
import { workspaceService } from '@/services/workspace.service';
import {
  resolveVariables,
  resolveKeyValuePairs,
  type EnvironmentVariable,
} from '@/utils/variable.util';
import type { ExecuteRequestResult, SavedRequest, KeyValuePair, RequestAuth } from '@/types';
import type { ExecuteRequestInput } from '@/validations/request.validation';
import type { TestResult } from '@/utils/sandbox/pm.context';

export type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'errored' | 'skipped';

export interface RequestRunResult {
  requestId: string;
  name: string;
  method: string;
  status: RunStatus;
  statusCode?: number;
  duration?: number;
  errorMessage?: string;
  tests: TestResult[];
  testsPassed: number;
  testsFailed: number;
}

export interface CollectionRunSummary {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  errored: number;
  totalTests: number;
  totalTestsPassed: number;
  totalTestsFailed: number;
  startedAt: number;
  finishedAt: number | null;
}

const buildExecutePayload = (
  request: SavedRequest,
  variables: EnvironmentVariable[]
): ExecuteRequestInput => {
  const resolvedUrl = resolveVariables(request.url, variables);
  const resolvedHeaders = resolveKeyValuePairs(request.headers || [], variables);
  const resolvedParams = resolveKeyValuePairs(request.params || [], variables);
  const resolvedBody = request.body ? resolveVariables(request.body, variables) : undefined;
  const resolvedAuth: RequestAuth | undefined = request.auth
    ? {
        ...request.auth,
        token: request.auth.token ? resolveVariables(request.auth.token, variables) : request.auth.token,
        username: request.auth.username ? resolveVariables(request.auth.username, variables) : request.auth.username,
        password: request.auth.password ? resolveVariables(request.auth.password, variables) : request.auth.password,
        apiKey: request.auth.apiKey ? resolveVariables(request.auth.apiKey, variables) : request.auth.apiKey,
        apiValue: request.auth.apiValue ? resolveVariables(request.auth.apiValue, variables) : request.auth.apiValue,
      }
    : undefined;

  return {
    method: request.method,
    url: resolvedUrl,
    headers: resolvedHeaders.filter((h) => h.enabled !== false && h.key),
    params: resolvedParams.filter((p) => p.enabled !== false && p.key),
    body: resolvedBody,
    auth: resolvedAuth,
  };
};

const mergeRuntimeVariables = (
  envVars: EnvironmentVariable[],
  runtime: Record<string, string>
): EnvironmentVariable[] => {
  const merged: Map<string, EnvironmentVariable> = new Map();
  for (const v of envVars) {
    merged.set(v.key, v);
  }
  for (const [k, v] of Object.entries(runtime)) {
    merged.set(k, { key: k, value: v, enabled: true });
  }
  return Array.from(merged.values());
};

export function useCollectionRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RequestRunResult[]>([]);
  const [summary, setSummary] = useState<CollectionRunSummary | null>(null);
  const cancelRef = useRef(false);

  const reset = useCallback(() => {
    setResults([]);
    setSummary(null);
    cancelRef.current = false;
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const run = useCallback(
    async (requests: SavedRequest[], environmentVars: EnvironmentVariable[]) => {
      if (requests.length === 0) return;
      scriptRunner.initialize();
      cancelRef.current = false;
      setIsRunning(true);
      setSummary({
        total: requests.length,
        completed: 0,
        passed: 0,
        failed: 0,
        errored: 0,
        totalTests: 0,
        totalTestsPassed: 0,
        totalTestsFailed: 0,
        startedAt: Date.now(),
        finishedAt: null,
      });
      const initial: RequestRunResult[] = requests.map((r) => ({
        requestId: r.id,
        name: r.name,
        method: r.method,
        status: 'pending',
        tests: [],
        testsPassed: 0,
        testsFailed: 0,
      }));
      setResults(initial);

      const runtimeVariables: Record<string, string> = {};
      let passed = 0;
      let failed = 0;
      let errored = 0;
      let totalTests = 0;
      let totalTestsPassed = 0;
      let totalTestsFailed = 0;

      for (let i = 0; i < requests.length; i++) {
        if (cancelRef.current) {
          setResults((prev) => prev.map((r, idx) => (idx >= i ? { ...r, status: 'skipped' } : r)));
          break;
        }

        const saved = requests[i];
        setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'running' } : r)));

        const result: RequestRunResult = { ...initial[i] };

        try {
          const allVars = mergeRuntimeVariables(environmentVars, runtimeVariables);
          let payload = buildExecutePayload(saved, allVars);

          // Pre-request script
          if (saved.preRequestScript && saved.preRequestScript.trim()) {
            const envMap: Record<string, string> = {};
            for (const v of allVars) if (v.enabled) envMap[v.key] = v.value;

            const preResult = await scriptRunner.runScript({
              script: saved.preRequestScript,
              pmContext: {
                request: {
                  method: payload.method,
                  url: payload.url,
                  headers: payload.headers.map((h) => ({ key: h.key, value: h.value })),
                  params: payload.params.map((p) => ({ key: p.key, value: p.value })),
                  body: payload.body || '',
                },
                variables: { ...runtimeVariables },
                environment: envMap,
                requestName: saved.name,
                eventName: 'prerequest',
              },
              timeout: 5000,
            });

            if (preResult.error) {
              throw new Error(`Pre-request script: ${preResult.error}`);
            }

            // Merge script-modified request
            payload = {
              ...payload,
              url: preResult.request.url,
              body: preResult.request.body || undefined,
              headers: preResult.request.headers.map((h) => ({ key: h.key, value: h.value, enabled: true })),
              params: preResult.request.params.map((p) => ({ key: p.key, value: p.value, enabled: true })),
            };

            // Persist runtime variables
            for (const [k, v] of Object.entries(preResult.variables || {})) {
              if (typeof v === 'string') runtimeVariables[k] = v;
            }
          }

          // Execute
          const startedAt = Date.now();
          let response: ExecuteRequestResult;
          try {
            response = await workspaceService.executeRequest(payload);
          } catch (err) {
            result.status = 'errored';
            result.errorMessage = err instanceof Error ? err.message : 'Network error';
            result.duration = Date.now() - startedAt;
            errored++;
            setResults((prev) => prev.map((r, idx) => (idx === i ? result : r)));
            continue;
          }

          result.statusCode = response.statusCode;
          result.duration = response.duration ?? Date.now() - startedAt;

          // Post-response script (tests)
          if (saved.postResponseScript && saved.postResponseScript.trim()) {
            const envMap2: Record<string, string> = {};
            const mergedNow = mergeRuntimeVariables(environmentVars, runtimeVariables);
            for (const v of mergedNow) if (v.enabled) envMap2[v.key] = v.value;

            const testResult = await scriptRunner.runTestScript({
              script: saved.postResponseScript,
              pmContext: {
                request: {
                  method: payload.method,
                  url: payload.url,
                  headers: payload.headers.map((h) => ({ key: h.key, value: h.value })),
                  params: payload.params.map((p) => ({ key: p.key, value: p.value })),
                  body: payload.body || '',
                },
                variables: { ...runtimeVariables },
                environment: envMap2,
                requestName: saved.name,
                eventName: 'test',
              },
              response: {
                statusCode: response.statusCode,
                statusText: response.statusText,
                headers: response.headers,
                body: response.body,
                duration: result.duration ?? 0,
                size: response.size,
              },
              timeout: 10000,
            });

            if (testResult.error) {
              result.errorMessage = `Test script: ${testResult.error}`;
            }

            result.tests = testResult.tests || [];
            result.testsPassed = testResult.testsPassed || 0;
            result.testsFailed = testResult.testsFailed || 0;
            totalTests += result.tests.length;
            totalTestsPassed += result.testsPassed;
            totalTestsFailed += result.testsFailed;

            for (const [k, v] of Object.entries(testResult.variables || {})) {
              if (typeof v === 'string') runtimeVariables[k] = v;
            }

            if (result.testsFailed > 0 || testResult.error) {
              result.status = 'failed';
              failed++;
            } else {
              result.status = 'passed';
              passed++;
            }
          } else if (response.statusCode >= 200 && response.statusCode < 400) {
            result.status = 'passed';
            passed++;
          } else {
            result.status = 'failed';
            result.errorMessage = `HTTP ${response.statusCode}`;
            failed++;
          }
        } catch (err) {
          result.status = 'errored';
          result.errorMessage = err instanceof Error ? err.message : String(err);
          errored++;
        }

        setResults((prev) => prev.map((r, idx) => (idx === i ? result : r)));
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                completed: i + 1,
                passed,
                failed,
                errored,
                totalTests,
                totalTestsPassed,
                totalTestsFailed,
              }
            : prev
        );
      }

      setSummary((prev) => (prev ? { ...prev, finishedAt: Date.now() } : prev));
      setIsRunning(false);
    },
    []
  );

  return { isRunning, results, summary, run, stop, reset };
}
