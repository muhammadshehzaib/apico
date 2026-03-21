'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HttpMethod,
  KeyValuePair,
  RequestAuth,
  ExecuteRequestResult,
  SavedRequest,
} from '@/types';
import { workspaceService } from '@/services/workspace.service';
import { isValidUrl } from '@/utils/request.util';
import {
  resolveVariables,
  resolveKeyValuePairs,
  EnvironmentVariable,
} from '@/utils/variable.util';
import { useScriptRunner } from './useScriptRunner';
import type { ParsedCurl } from '@/utils/curl.parser';
import type { ConsoleLine } from '@/utils/sandbox/pm.context';

const STORAGE_KEY = 'apico_last_request';

interface RequestState {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  auth: RequestAuth;
  preRequestScript: string;
  postResponseScript: string;
  activeTab: 'params' | 'headers' | 'body' | 'auth' | 'scripts';
  isLoading: boolean;
  response: ExecuteRequestResult | null;
  error: string | null;
  urlError: string | null;
  activeVariables: EnvironmentVariable[];
}

const defaultState: RequestState = {
  method: HttpMethod.GET,
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  params: [{ key: '', value: '', enabled: true }],
  body: '',
  auth: { type: 'none' },
  preRequestScript: '',
  postResponseScript: '',
  activeTab: 'params',
  isLoading: false,
  response: null,
  error: null,
  urlError: null,
  activeVariables: [],
};

export function useRequestBuilder() {
  const [state, setState] = useState<RequestState>(defaultState);

  const {
    runPreRequestScript,
    consoleLogs,
    scriptError,
    isRunning: isScriptRunning,
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
  } = useScriptRunner(state.preRequestScript);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setMethod = useCallback((method: HttpMethod) => {
    setState((prev) => ({ ...prev, method }));
  }, []);

  const setUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, url, urlError: null }));
  }, []);

  const setHeaders = useCallback((headers: KeyValuePair[]) => {
    setState((prev) => ({ ...prev, headers }));
  }, []);

  const setParams = useCallback((params: KeyValuePair[]) => {
    setState((prev) => ({ ...prev, params }));
  }, []);

  const setBody = useCallback((body: string) => {
    setState((prev) => ({ ...prev, body }));
  }, []);

  const setAuth = useCallback((auth: RequestAuth) => {
    setState((prev) => ({ ...prev, auth }));
  }, []);

  const setActiveTab = useCallback((activeTab: 'params' | 'headers' | 'body' | 'auth' | 'scripts') => {
    setState((prev) => ({ ...prev, activeTab }));
  }, []);

  const setActiveVariables = useCallback((activeVariables: EnvironmentVariable[]) => {
    setState((prev) => ({ ...prev, activeVariables }));
  }, []);

  const setPreRequestScript = useCallback((preRequestScript: string) => {
    setState((prev) => ({ ...prev, preRequestScript }));
  }, []);

  const setPostResponseScript = useCallback((postResponseScript: string) => {
    setState((prev) => ({ ...prev, postResponseScript }));
  }, []);

  const clearResponse = useCallback(() => {
    setState((prev) => ({ ...prev, response: null, error: null }));
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadSavedRequest = useCallback((request: SavedRequest) => {
    setState((prev) => ({
      ...prev,
      method: request.method,
      url: request.url,
      headers: request.headers || [{ key: '', value: '', enabled: true }],
      params: request.params || [{ key: '', value: '', enabled: true }],
      body: request.body || '',
      auth: request.auth || { type: 'none' },
      response: null,
      error: null,
      urlError: null,
    }));
  }, []);

  const loadFromCurl = useCallback((parsed: ParsedCurl) => {
    setState((prev) => ({
      ...prev,
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers.length > 0
        ? parsed.headers
        : [{ key: '', value: '', enabled: true }],
      params: parsed.params.length > 0
        ? parsed.params
        : [{ key: '', value: '', enabled: true }],
      body: parsed.body,
      auth: parsed.auth,
      response: null,
      error: null,
      urlError: null,
    }));
  }, []);

  const sendRequest = useCallback(async () => {
    if (!state.url.trim()) {
      setState((prev) => ({ ...prev, urlError: 'URL is required' }));
      return;
    }

    if (!isValidUrl(state.url)) {
      setState((prev) => ({ ...prev, urlError: 'Invalid URL' }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      response: null,
      error: null,
      urlError: null,
    }));

    try {
      // Resolve variables in all request fields
      let resolvedPayload: any = {
        method: state.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        url: resolveVariables(state.url, state.activeVariables),
        headers: resolveKeyValuePairs(state.headers, state.activeVariables).filter(h => h.enabled && h.key.trim() !== ''),
        params: resolveKeyValuePairs(state.params, state.activeVariables).filter(p => p.enabled && p.key.trim() !== ''),
        body: resolveVariables(state.body, state.activeVariables),
        auth: {
          ...state.auth,
          token: state.auth.token
            ? resolveVariables(state.auth.token, state.activeVariables)
            : undefined,
          username: state.auth.username
            ? resolveVariables(state.auth.username, state.activeVariables)
            : undefined,
          password: state.auth.password
            ? resolveVariables(state.auth.password, state.activeVariables)
            : undefined,
        },
      };

      // Run pre-request script if provided
      if (state.preRequestScript.trim()) {
        resolvedPayload = await runPreRequestScript(
          resolvedPayload as any,
          state.activeVariables as any
        );
      }

      const result = await workspaceService.executeRequest(resolvedPayload as any);

      setState((prev) => ({ ...prev, response: result, isLoading: false }));

      // Run test script if provided
      if (state.postResponseScript.trim()) {
        await runTestScript(
          state.postResponseScript,
          resolvedPayload as any,
          result,
          state.activeVariables as any
        );
      }

      // Persist to localStorage
      const toSave = { ...state, response: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [state, runPreRequestScript, runTestScript]);

  return {
    ...state,
    setMethod,
    setUrl,
    setHeaders,
    setParams,
    setBody,
    setAuth,
    setActiveTab,
    setActiveVariables,
    setPreRequestScript,
    setPostResponseScript,
    sendRequest,
    clearResponse,
    resetAll,
    loadSavedRequest,
    loadFromCurl,
    consoleLogs,
    scriptError,
    isScriptRunning,
    lastRunDuration,
    clearLogs,
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
