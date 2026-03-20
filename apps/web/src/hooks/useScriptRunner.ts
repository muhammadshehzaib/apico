'use client';

import { useState, useEffect, useCallback } from 'react';
import { scriptRunner } from '@/utils/sandbox/script.runner';
import type { ConsoleLine, PmContext, PmResult, PmTestResult, PmResponse, TestResult } from '@/utils/sandbox/pm.context';
import type { ExecuteRequestPayload, ExecuteRequestResult } from '@/types/api';
import type { EnvironmentVariable } from '@/types/environment';

export function useScriptRunner(preRequestScript: string) {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLine[]>([]);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunDuration, setLastRunDuration] = useState<number | null>(null);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsPassed, setTestsPassed] = useState(0);
  const [testsFailed, setTestsFailed] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testConsoleLogs, setTestConsoleLogs] = useState<ConsoleLine[]>([]);
  const [lastTestRunDuration, setLastTestRunDuration] = useState<number | null>(null);

  // Initialize script runner on mount
  useEffect(() => {
    scriptRunner.initialize();
    return () => {
      scriptRunner.destroy();
    };
  }, []);

  const runPreRequestScript = useCallback(
    async (
      request: ExecuteRequestPayload,
      activeVariables: EnvironmentVariable[]
    ): Promise<ExecuteRequestPayload> => {
      if (!preRequestScript.trim()) {
        return request;
      }

      setIsRunning(true);
      setScriptError(null);
      setConsoleLogs([]);

      const startTime = Date.now();

      try {
        // Build environment variables map
        const environmentMap: Record<string, string> = {};
        for (const variable of activeVariables) {
          if (variable.enabled) {
            environmentMap[variable.name] = variable.value;
          }
        }

        // Build headers array
        const headers = request.headers
          .filter((h) => h.enabled)
          .map((h) => ({ key: h.name, value: h.value }));

        // Build params array
        const params = request.params
          .filter((p) => p.enabled)
          .map((p) => ({ key: p.name, value: p.value }));

        // Build PM context
        const pmContext: PmContext = {
          request: {
            method: request.method,
            url: request.url,
            headers,
            params,
            body: request.body || '',
          },
          variables: {},
          environment: environmentMap,
          requestName: '',
          eventName: 'prerequest',
        };

        // Run the script
        const result = await scriptRunner.runScript({
          script: preRequestScript,
          pmContext,
          timeout: 5000,
        });

        setLastRunDuration(Date.now() - startTime);
        setConsoleLogs(result.logs);

        if (result.error) {
          setScriptError(result.error);
          return request; // Return original request on error
        }

        // Merge script results back into request
        const modifiedRequest: ExecuteRequestPayload = {
          ...request,
          url: result.request.url,
          body: result.request.body,
          headers: request.headers.map((h) => {
            // Find if script modified this header
            const scriptHeader = result.request.headers.find(
              (sh) => sh.key.toLowerCase() === h.name.toLowerCase()
            );
            return scriptHeader
              ? { ...h, value: scriptHeader.value }
              : h;
          }),
          params: request.params.map((p) => {
            // Find if script modified this param
            const scriptParam = result.request.params.find(
              (sp) => sp.key === p.name
            );
            return scriptParam
              ? { ...p, value: scriptParam.value }
              : p;
          }),
        };

        // Also add any new headers/params added by script
        for (const scriptHeader of result.request.headers) {
          if (
            !modifiedRequest.headers.some(
              (h) => h.name.toLowerCase() === scriptHeader.key.toLowerCase()
            )
          ) {
            modifiedRequest.headers.push({
              name: scriptHeader.key,
              value: scriptHeader.value,
              enabled: true,
            });
          }
        }

        for (const scriptParam of result.request.params) {
          if (
            !modifiedRequest.params.some((p) => p.name === scriptParam.key)
          ) {
            modifiedRequest.params.push({
              name: scriptParam.key,
              value: scriptParam.value,
              enabled: true,
            });
          }
        }

        return modifiedRequest;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown script error';
        setScriptError(errorMessage);
        setLastRunDuration(Date.now() - startTime);
        return request; // Return original request on error
      } finally {
        setIsRunning(false);
      }
    },
    [preRequestScript]
  );

  const clearLogs = useCallback(() => {
    setConsoleLogs([]);
    setScriptError(null);
  }, []);

  const runTestScript = useCallback(
    async (
      testScript: string,
      request: ExecuteRequestPayload,
      response: ExecuteRequestResult,
      activeVariables: EnvironmentVariable[]
    ): Promise<void> => {
      if (!testScript.trim()) {
        return;
      }

      setIsTestRunning(true);
      setTestError(null);
      setTestConsoleLogs([]);

      const startTime = Date.now();

      try {
        // Build environment variables map
        const environmentMap: Record<string, string> = {};
        for (const variable of activeVariables) {
          if (variable.enabled) {
            environmentMap[variable.name] = variable.value;
          }
        }

        // Build headers array
        const headers = request.headers
          .filter((h) => h.enabled)
          .map((h) => ({ key: h.name, value: h.value }));

        // Build params array
        const params = request.params
          .filter((p) => p.enabled)
          .map((p) => ({ key: p.name, value: p.value }));

        // Build response object
        const pmResponse: PmResponse = {
          statusCode: response.statusCode,
          statusText: response.statusText || '',
          duration: response.duration || 0,
          size: response.size || 0,
          headers: response.headers || {},
          body: response.body || '',
        };

        // Build PM context with response
        const pmContext: PmContext & { response: PmResponse } = {
          request: {
            method: request.method,
            url: request.url,
            headers,
            params,
            body: request.body || '',
          },
          variables: {},
          environment: environmentMap,
          requestName: '',
          eventName: 'test',
          response: pmResponse,
        };

        // Run the test script
        const result = await scriptRunner.runTestScript({
          script: testScript,
          pmContext: pmContext as any,
          response: pmResponse,
          timeout: 10000,
        });

        setLastTestRunDuration(Date.now() - startTime);
        setTestConsoleLogs(result.logs);

        if (result.error) {
          setTestError(result.error);
        }

        setTestResults(result.tests);
        setTestsPassed(result.testsPassed);
        setTestsFailed(result.testsFailed);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown test error';
        setTestError(errorMessage);
        setLastTestRunDuration(Date.now() - startTime);
        setTestResults([]);
        setTestsPassed(0);
        setTestsFailed(0);
      } finally {
        setIsTestRunning(false);
      }
    },
    []
  );

  const clearTestResults = useCallback(() => {
    setTestResults([]);
    setTestsPassed(0);
    setTestsFailed(0);
    setTestConsoleLogs([]);
    setTestError(null);
  }, []);

  return {
    runPreRequestScript,
    consoleLogs,
    scriptError,
    isRunning,
    lastRunDuration,
    clearLogs,
    runTestScript,
    testResults,
    testsPassed,
    testsFailed,
    isTestRunning,
    testError,
    testConsoleLogs,
    lastTestRunDuration,
    clearTestResults,
  };
}
