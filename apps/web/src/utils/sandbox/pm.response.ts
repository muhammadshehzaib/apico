// PM Response Types - API Response object for test scripts

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

export interface PmTestResult {
  request: any;
  variables: Record<string, string>;
  logs: Array<{ type: string; message: string; timestamp: number }>;
  error: string | null;
  tests: TestResult[];
  testsPassed: number;
  testsFailed: number;
}
