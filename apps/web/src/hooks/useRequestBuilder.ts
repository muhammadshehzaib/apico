'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HttpMethod,
  KeyValuePair,
  RequestAuth,
  ExecuteRequestResult,
  SavedRequest,
  BodyType,
  FormDataField,
} from '@/types';
import { workspaceService } from '@/services/workspace.service';
import { isValidUrl } from '@/utils/request.util';
import {
  resolveVariables,
  resolveKeyValuePairs,
  EnvironmentVariable,
} from '@/utils/variable.util';
import { useScriptRunner, type RuntimeVariables } from './useScriptRunner';
import type { ParsedCurl } from '@/utils/curl.parser';
import type { ConsoleLine } from '@/utils/sandbox/pm.context';
import { executeRequestSchema, type ExecuteRequestInput } from '@/validations/request.validation';

const STORAGE_KEY = 'apico_last_request';

interface RequestState {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  formDataFields: FormDataField[];
  auth: RequestAuth;
  preRequestScript: string;
  postResponseScript: string;
  activeTab: 'params' | 'headers' | 'body' | 'auth' | 'scripts';
  isLoading: boolean;
  response: ExecuteRequestResult | null;
  error: string | null;
  urlError: string | null;
  activeVariables: EnvironmentVariable[];
  runtimeVariables: RuntimeVariables;
}

const defaultState: RequestState = {
  method: HttpMethod.GET,
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  params: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'json',
  formDataFields: [{ key: '', type: 'text', value: '', enabled: true }],
  auth: { type: 'none' },
  preRequestScript: '',
  postResponseScript: '',
  activeTab: 'params',
  isLoading: false,
  response: null,
  error: null,
  urlError: null,
  activeVariables: [],
  runtimeVariables: {},
};

export function useRequestBuilder() {
  const [state, setState] = useState<RequestState>(defaultState);
  const [formDataFiles, setFormDataFiles] = useState<Map<string, File>>(new Map());
  const [responseHistory, setResponseHistory] = useState<
    Record<string, { result: ExecuteRequestResult; at: string }[]>
  >({});

  const getResponseKey = useCallback((method: HttpMethod, url: string) => {
    return `${method}::${url.trim()}`;
  }, []);

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

  const setBodyType = useCallback((bodyType: BodyType) => {
    setState((prev) => ({ ...prev, bodyType }));
  }, []);

  const setFormDataFields = useCallback((formDataFields: FormDataField[]) => {
    setState((prev) => ({ ...prev, formDataFields }));
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
    setFormDataFiles(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadSavedRequest = useCallback((request: SavedRequest) => {
    let bodyType: BodyType = 'json';
    let body = request.body || '';
    let formDataFields: FormDataField[] = [{ key: '', type: 'text', value: '', enabled: true }];

    // Detect form-data serialized body
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (parsed.__bodyType === 'form-data' && Array.isArray(parsed.fields)) {
          bodyType = 'form-data';
          formDataFields = parsed.fields;
          body = '';
        }
      } catch {
        // Not JSON envelope, treat as regular body
      }
    }

    setFormDataFiles(new Map());
    setState((prev) => ({
      ...prev,
      method: request.method,
      url: request.url,
      headers: request.headers || [{ key: '', value: '', enabled: true }],
      params: request.params || [{ key: '', value: '', enabled: true }],
      body,
      bodyType,
      formDataFields,
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

    const runtimeEntries =
      state.runtimeVariables &&
      typeof state.runtimeVariables === 'object' &&
      !Array.isArray(state.runtimeVariables)
        ? Object.entries(state.runtimeVariables)
        : [];

    const activeVariables = Array.isArray(state.activeVariables) ? state.activeVariables : [];

    const resolutionVariables: EnvironmentVariable[] = [
      ...runtimeEntries.map(([key, value]) => ({
        key,
        value,
        enabled: true,
      })),
      ...activeVariables,
    ];

    const resolvedUrl = resolveVariables(state.url, resolutionVariables);
    if (!isValidUrl(resolvedUrl)) {
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
      const resolvedHeaders = resolveKeyValuePairs(state.headers, resolutionVariables).filter(h => h.enabled && h.key.trim() !== '');
      const resolvedParams = resolveKeyValuePairs(state.params, resolutionVariables).filter(p => p.enabled && p.key.trim() !== '');
      const resolvedAuth = {
        ...state.auth,
        token: state.auth.token
          ? resolveVariables(state.auth.token, resolutionVariables)
          : undefined,
        username: state.auth.username
          ? resolveVariables(state.auth.username, resolutionVariables)
          : undefined,
        password: state.auth.password
          ? resolveVariables(state.auth.password, resolutionVariables)
          : undefined,
        apiKey: state.auth.apiKey
          ? resolveVariables(state.auth.apiKey, resolutionVariables)
          : undefined,
        apiValue: state.auth.apiValue
          ? resolveVariables(state.auth.apiValue, resolutionVariables)
          : undefined,
      };

      let runtimeVariables: RuntimeVariables = state.runtimeVariables || {};
      let result: ExecuteRequestResult;
      let executedRequest: ExecuteRequestInput | null = null;

      if (state.bodyType === 'form-data') {
        // Resolve variables in form-data text fields
        const resolvedFields = state.formDataFields.map((field) => ({
          ...field,
          key: resolveVariables(field.key, resolutionVariables),
          value: field.type === 'text'
            ? resolveVariables(field.value, resolutionVariables)
            : field.value,
        }));

        // Build browser FormData
        const fd = new FormData();
        fd.append('__metadata', JSON.stringify({
          method: state.method,
          url: resolveVariables(state.url, resolutionVariables),
          headers: resolvedHeaders,
          params: resolvedParams,
          bodyType: 'form-data',
          fields: resolvedFields,
          auth: resolvedAuth,
        }));

        for (let i = 0; i < resolvedFields.length; i++) {
          const field = resolvedFields[i];
          if (!field.enabled || !field.key.trim()) continue;
          if (field.type === 'file') {
            const file = formDataFiles.get(String(i));
            if (file) {
              fd.append(`file_${field.key}`, file);
            }
          }
        }

        result = await workspaceService.executeFormDataRequest(fd);
        executedRequest = {
          method: state.method as ExecuteRequestInput['method'],
          url: resolveVariables(state.url, resolutionVariables),
          headers: resolvedHeaders,
          params: resolvedParams,
          body: '',
          auth: resolvedAuth,
        };
      } else {
        let resolvedPayload: ExecuteRequestInput = {
          method: state.method as ExecuteRequestInput['method'],
          url: resolveVariables(state.url, resolutionVariables),
          headers: resolvedHeaders,
          params: resolvedParams,
          body: resolveVariables(state.body, resolutionVariables),
          auth: resolvedAuth,
        };

        // Run pre-request script if provided
        if (state.preRequestScript.trim()) {
          const preResult = await runPreRequestScript(
            resolvedPayload,
            state.activeVariables,
            runtimeVariables
          );
          resolvedPayload = preResult.request;
          runtimeVariables = preResult.variables;
        }

        const parsed = executeRequestSchema.safeParse(resolvedPayload);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw new Error(issue?.message || 'Request validation failed');
        }

        executedRequest = parsed.data;
        result = await workspaceService.executeRequest(executedRequest);
      }

      setState((prev) => ({ ...prev, response: result, isLoading: false, runtimeVariables }));

      const responseKey = getResponseKey(state.method, state.url);
      setResponseHistory((prev) => {
        const list = [
          ...(prev[responseKey] || []),
          { result, at: new Date().toISOString() },
        ].slice(-5);
        return { ...prev, [responseKey]: list };
      });

      // Run test script if provided
      if (state.postResponseScript.trim()) {
        const testResult = await runTestScript(
          state.postResponseScript,
          executedRequest ?? {
            method: state.method as ExecuteRequestInput['method'],
            url: resolveVariables(state.url, resolutionVariables),
            headers: resolvedHeaders,
            params: resolvedParams,
            body: resolveVariables(state.body, resolutionVariables),
            auth: resolvedAuth,
          },
          result,
          state.activeVariables,
          runtimeVariables
        );
        runtimeVariables = testResult.variables;
        setState((prev) => ({ ...prev, runtimeVariables }));
      }

      // Persist to localStorage (exclude non-serializable formDataFiles)
      const toSave = { ...state, runtimeVariables, response: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [state, formDataFiles, runPreRequestScript, runTestScript, getResponseKey]);

  const responseKey = getResponseKey(state.method, state.url);
  const responseHistoryList = responseHistory[responseKey] || [];
  const previousResponse =
    responseHistoryList.length > 1
      ? responseHistoryList[responseHistoryList.length - 2].result
      : null;

  return {
    ...state,
    formDataFiles,
    previousResponse,
    responseHistory: responseHistoryList,
    setMethod,
    setUrl,
    setHeaders,
    setParams,
    setBody,
    setBodyType,
    setFormDataFields,
    setFormDataFiles,
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
