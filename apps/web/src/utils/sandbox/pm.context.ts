// PM Context Types - Postman-like API for scripts

export interface PmRequestHeader {
  key: string;
  value: string;
}

export interface PmRequestParam {
  key: string;
  value: string;
}

export interface PmRequest {
  method: string;
  url: string;
  headers: PmRequestHeader[];
  params: PmRequestParam[];
  body: string;
}

export interface PmVariables {
  [key: string]: string;
}

export interface PmContext {
  request: PmRequest;
  variables: PmVariables;
  environment: Record<string, string>;
  requestName?: string;
  eventName?: string;
}

export interface ConsoleLine {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface PmResult {
  request: PmRequest;
  variables: PmVariables;
  logs: ConsoleLine[];
  error: string | null;
}

export interface PmResponse {
  statusCode: number;
  statusText: string;
  duration: number;
  size: number;
  headers: Record<string, string | string[]>;
  body: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error: string | null;
  duration: number;
}

export interface PmTestResult extends PmResult {
  tests: TestResult[];
  testsPassed: number;
  testsFailed: number;
}
