'use client';

import { useState, useEffect, useCallback } from 'react';
import { scriptRunner } from '@/utils/sandbox/script.runner';
import type { ConsoleLine, PmContext, PmResult, PmTestResult, PmResponse, TestResult } from '@/utils/sandbox/pm.context';
import type { ExecuteRequestInput } from '@/validations/request.validation';
import type { ExecuteRequestResult } from '@/types';
import type { EnvironmentVariable } from '@/services/environment.service';

export type RuntimeVariables = Record<string, string>;

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
      request: ExecuteRequestInput,
      activeVariables: EnvironmentVariable[],
      runtimeVariables: RuntimeVariables
    ): Promise<{ request: ExecuteRequestInput; variables: RuntimeVariables }> => {
      if (!preRequestScript.trim()) {
        return { request, variables: runtimeVariables };
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
            environmentMap[variable.key] = variable.value;
          }
        }

        // Build headers array
        const headers = request.headers
          .filter((h) => h.enabled)
          .map((h) => ({ key: h.key, value: h.value }));

        // Build params array
        const params = request.params
          .filter((p) => p.enabled)
          .map((p) => ({ key: p.key, value: p.value }));

        // Build PM context
        const pmContext: PmContext = {
          request: {
            method: request.method,
            url: request.url,
            headers,
            params,
            body: request.body || '',
          },
          variables: { ...runtimeVariables },
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
          return { request, variables: runtimeVariables }; // Return original request on error
        }

        // Merge script results back into request
        const modifiedRequest: ExecuteRequestInput = {
          ...request,
          url: result.request.url,
          body: result.request.body,
          headers: request.headers.map((h) => {
            // Find if script modified this header
            const scriptHeader = result.request.headers.find(
              (sh) => sh.key.toLowerCase() === h.key.toLowerCase()
            );
            return scriptHeader
              ? { ...h, value: scriptHeader.value }
              : h;
          }),
          params: request.params.map((p) => {
            // Find if script modified this param
            const scriptParam = result.request.params.find(
              (sp) => sp.key === p.key
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
              (h) => h.key.toLowerCase() === scriptHeader.key.toLowerCase()
            )
          ) {
            modifiedRequest.headers.push({
              key: scriptHeader.key,
              value: scriptHeader.value,
              enabled: true,
            });
          }
        }

        for (const scriptParam of result.request.params) {
          if (
            !modifiedRequest.params.some((p) => p.key === scriptParam.key)
          ) {
            modifiedRequest.params.push({
              key: scriptParam.key,
              value: scriptParam.value,
              enabled: true,
            });
          }
        }

        return { request: modifiedRequest, variables: result.variables || runtimeVariables };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown script error';
        setScriptError(errorMessage);
        setLastRunDuration(Date.now() - startTime);
        return { request, variables: runtimeVariables }; // Return original request on error
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
      request: ExecuteRequestInput,
      response: ExecuteRequestResult,
      activeVariables: EnvironmentVariable[],
      runtimeVariables: RuntimeVariables
    ): Promise<{ variables: RuntimeVariables }> => {
      if (!testScript.trim()) {
        return { variables: runtimeVariables };
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
            environmentMap[variable.key] = variable.value;
          }
        }

        // Build headers array
        const headers = request.headers
          .filter((h) => h.enabled)
          .map((h) => ({ key: h.key, value: h.value }));

        // Build params array
        const params = request.params
          .filter((p) => p.enabled)
          .map((p) => ({ key: p.key, value: p.value }));

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
          variables: { ...runtimeVariables },
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

        return { variables: result.variables || runtimeVariables };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown test error';
        setTestError(errorMessage);
        setLastTestRunDuration(Date.now() - startTime);
        setTestResults([]);
        setTestsPassed(0);
        setTestsFailed(0);
        return { variables: runtimeVariables };
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
