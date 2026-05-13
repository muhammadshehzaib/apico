import vm from 'vm';

export interface SandboxRequest {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  params: Array<{ key: string; value: string }>;
  body: string;
}

export interface SandboxResponse {
  statusCode: number;
  statusText: string;
  duration: number;
  size: number;
  headers: Record<string, string | string[]>;
  body: string;
}

export interface ConsoleLine {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error: string | null;
  duration: number;
}

export interface PreScriptResult {
  request: SandboxRequest;
  variables: Record<string, string>;
  logs: ConsoleLine[];
  error: string | null;
}

export interface PostScriptResult extends PreScriptResult {
  tests: TestResult[];
  testsPassed: number;
  testsFailed: number;
}

export interface PreScriptOptions {
  script: string;
  request: SandboxRequest;
  variables: Record<string, string>;
  environment: Record<string, string>;
  requestName: string;
  timeoutMs?: number;
}

export interface PostScriptOptions extends PreScriptOptions {
  response: SandboxResponse;
}

const buildPmRequestProxy = (request: SandboxRequest) => {
  const headers = [...request.headers];
  const params = [...request.params];
  const mutable = { ...request };

  const headersApi = {
    add(item: { key: string; value: string }) {
      if (!item || typeof item.key !== 'string') return;
      const idx = headers.findIndex((h) => h.key.toLowerCase() === item.key.toLowerCase());
      if (idx >= 0) headers[idx] = { key: item.key, value: String(item.value) };
      else headers.push({ key: item.key, value: String(item.value) });
    },
    get(key: string) {
      return headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
    },
    remove(key: string) {
      const idx = headers.findIndex((h) => h.key.toLowerCase() === key.toLowerCase());
      if (idx >= 0) headers.splice(idx, 1);
    },
    toArray() {
      return [...headers];
    },
  };

  const paramsApi = {
    add(item: { key: string; value: string }) {
      if (!item || typeof item.key !== 'string') return;
      params.push({ key: item.key, value: String(item.value) });
    },
    get(key: string) {
      return params.find((p) => p.key === key)?.value;
    },
    remove(key: string) {
      const idx = params.findIndex((p) => p.key === key);
      if (idx >= 0) params.splice(idx, 1);
    },
    toArray() {
      return [...params];
    },
  };

  const requestProxy = {
    get url() {
      return mutable.url;
    },
    set url(v: string) {
      mutable.url = v;
    },
    get method() {
      return mutable.method;
    },
    get body() {
      return mutable.body;
    },
    set body(v: string) {
      mutable.body = v;
    },
    headers: headersApi,
    params: paramsApi,
  };

  const snapshot = (): SandboxRequest => ({
    method: mutable.method,
    url: mutable.url,
    body: mutable.body,
    headers: [...headers],
    params: [...params],
  });

  return { requestProxy, snapshot };
};

const buildExpect = () => {
  const make = (actual: any, negated = false): any => {
    const check = (condition: boolean, msg: string) => {
      if (negated ? condition : !condition) {
        throw new Error(msg);
      }
    };
    const chain: any = {
      equal(expected: any) {
        check(
          actual === expected,
          `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to equal ${JSON.stringify(expected)}`
        );
        return chain;
      },
      eql(expected: any) {
        check(
          JSON.stringify(actual) === JSON.stringify(expected),
          `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to deeply equal ${JSON.stringify(expected)}`
        );
        return chain;
      },
      exist() {
        check(
          actual !== null && actual !== undefined,
          `Expected value${negated ? ' not ' : ' '}to exist (got ${JSON.stringify(actual)})`
        );
        return chain;
      },
      include(expected: any) {
        const ok =
          (typeof actual === 'string' && actual.includes(expected)) ||
          (Array.isArray(actual) && actual.includes(expected));
        check(ok, `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to include ${JSON.stringify(expected)}`);
        return chain;
      },
      contains(expected: any) {
        return chain.include(expected);
      },
      above(expected: number) {
        check(
          typeof actual === 'number' && actual > expected,
          `Expected ${actual}${negated ? ' not ' : ' '}to be above ${expected}`
        );
        return chain;
      },
      below(expected: number) {
        check(
          typeof actual === 'number' && actual < expected,
          `Expected ${actual}${negated ? ' not ' : ' '}to be below ${expected}`
        );
        return chain;
      },
      least(expected: number) {
        check(
          typeof actual === 'number' && actual >= expected,
          `Expected ${actual}${negated ? ' not ' : ' '}to be at least ${expected}`
        );
        return chain;
      },
      most(expected: number) {
        check(
          typeof actual === 'number' && actual <= expected,
          `Expected ${actual}${negated ? ' not ' : ' '}to be at most ${expected}`
        );
        return chain;
      },
      ok() {
        check(!!actual, `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to be truthy`);
        return chain;
      },
      true() {
        check(actual === true, `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to be true`);
        return chain;
      },
      false() {
        check(actual === false, `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to be false`);
        return chain;
      },
      null() {
        check(actual === null, `Expected ${JSON.stringify(actual)}${negated ? ' not ' : ' '}to be null`);
        return chain;
      },
      undefined() {
        check(actual === undefined, `Expected value${negated ? ' not ' : ' '}to be undefined`);
        return chain;
      },
      type(expected: string) {
        const actualType = Array.isArray(actual) ? 'array' : typeof actual;
        check(
          actualType === expected,
          `Expected type "${expected}"${negated ? ' not ' : ''} but got "${actualType}"`
        );
        return chain;
      },
      a(expected: string) {
        return chain.type(expected);
      },
      an(expected: string) {
        return chain.type(expected);
      },
      property(key: string, value?: any) {
        if (typeof actual !== 'object' || actual === null) {
          throw new Error('property() requires an object');
        }
        check(key in actual, `Expected object${negated ? ' not ' : ' '}to have property "${key}"`);
        if (value !== undefined) {
          check(
            actual[key] === value,
            `Expected property "${key}" to equal ${JSON.stringify(value)} but got ${JSON.stringify(actual[key])}`
          );
        }
        return chain;
      },
      length(expected: number) {
        if (actual == null) throw new Error('length() called on null/undefined');
        check(actual.length === expected, `Expected length ${expected} but got ${actual.length}`);
        return chain;
      },
      lengthOf(expected: number) {
        return chain.length(expected);
      },
      match(regex: RegExp) {
        check(
          typeof actual === 'string' && regex.test(actual),
          `Expected "${actual}"${negated ? ' not ' : ' '}to match ${regex}`
        );
        return chain;
      },
      get not() {
        return make(actual, !negated);
      },
      get to() {
        return chain;
      },
      get be() {
        return chain;
      },
      get have() {
        return chain;
      },
      get that() {
        return chain;
      },
      get and() {
        return chain;
      },
      get has() {
        return chain;
      },
    };
    return chain;
  };

  return (actual: any) => make(actual);
};

const buildPm = (
  request: SandboxRequest,
  variables: Record<string, string>,
  environment: Record<string, string>,
  requestName: string,
  eventName: 'prerequest' | 'test',
  response: SandboxResponse | undefined,
  tests: TestResult[]
) => {
  const { requestProxy, snapshot } = buildPmRequestProxy(request);
  const vars = { ...variables };

  const pm: any = {
    request: requestProxy,
    variables: {
      set(key: string, value: any) {
        vars[String(key)] = String(value);
      },
      get(key: string) {
        return vars[key] ?? environment[key] ?? undefined;
      },
      has(key: string) {
        return key in vars || key in environment;
      },
    },
    environment: {
      get(key: string) {
        return environment[key] ?? vars[key] ?? undefined;
      },
      set(key: string, value: any) {
        // Postman compatibility — treat as runtime variable
        vars[String(key)] = String(value);
      },
      has(key: string) {
        return key in environment || key in vars;
      },
    },
    info: {
      requestName,
      eventName,
    },
  };

  if (response) {
    pm.response = {
      get statusCode() {
        return response.statusCode;
      },
      get code() {
        return response.statusCode;
      },
      get statusText() {
        return response.statusText;
      },
      get status() {
        return response.statusText;
      },
      get duration() {
        return response.duration;
      },
      get responseTime() {
        return response.duration;
      },
      get size() {
        return response.size;
      },
      json() {
        try {
          return JSON.parse(response.body);
        } catch {
          throw new Error('Response body is not valid JSON');
        }
      },
      text() {
        return response.body;
      },
      headers: {
        get(key: string) {
          const v = response.headers[key.toLowerCase()];
          if (Array.isArray(v)) return v.join(', ');
          return v ?? null;
        },
        has(key: string) {
          return key.toLowerCase() in response.headers;
        },
        toObject() {
          return { ...response.headers };
        },
      },
      to: {
        have: {
          status(code: number) {
            if (response.statusCode !== code) {
              throw new Error(`Expected status ${code} but got ${response.statusCode}`);
            }
          },
        },
      },
    };

    pm.test = (name: string, fn: () => void) => {
      const start = Date.now();
      const r: TestResult = { name, passed: false, error: null, duration: 0 };
      try {
        fn();
        r.passed = true;
      } catch (err) {
        r.passed = false;
        r.error = err instanceof Error ? err.message : String(err);
      } finally {
        r.duration = Date.now() - start;
      }
      tests.push(r);
    };

    pm.expect = buildExpect();
  }

  return { pm, snapshot, getVariables: () => ({ ...vars }) };
};

const runScript = async (
  code: string,
  pm: any,
  consoleApi: any,
  timeoutMs: number
): Promise<void> => {
  const sandbox: Record<string, any> = {
    pm,
    console: consoleApi,
    setTimeout,
    clearTimeout,
    Date,
    JSON,
    Math,
    Buffer,
    URL,
    URLSearchParams,
  };
  const context = vm.createContext(sandbox, { name: 'apico-script' });
  const wrapped = `(async () => { ${code}\n })()`;
  const script = new vm.Script(wrapped, { filename: 'apico-script.js' });
  const promise = script.runInContext(context, { timeout: timeoutMs });
  await promise;
};

const captureConsole = (logs: ConsoleLine[]) => {
  const make = (type: ConsoleLine['type']) => (...args: any[]) => {
    logs.push({
      type,
      timestamp: Date.now(),
      message: args
        .map((a) => (typeof a === 'object' ? safeStringify(a) : String(a)))
        .join(' '),
    });
  };
  return {
    log: make('log'),
    info: make('info'),
    warn: make('warn'),
    error: make('error'),
  };
};

const safeStringify = (v: any): string => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

export const runPreRequestScript = async (
  options: PreScriptOptions
): Promise<PreScriptResult> => {
  const timeout = options.timeoutMs ?? 5000;
  const logs: ConsoleLine[] = [];
  const consoleApi = captureConsole(logs);
  const { pm, snapshot, getVariables } = buildPm(
    options.request,
    options.variables,
    options.environment,
    options.requestName,
    'prerequest',
    undefined,
    []
  );

  let error: string | null = null;
  try {
    await runScript(options.script, pm, consoleApi, timeout);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return {
    request: snapshot(),
    variables: getVariables(),
    logs,
    error,
  };
};

export const runPostResponseScript = async (
  options: PostScriptOptions
): Promise<PostScriptResult> => {
  const timeout = options.timeoutMs ?? 10000;
  const logs: ConsoleLine[] = [];
  const consoleApi = captureConsole(logs);
  const tests: TestResult[] = [];
  const { pm, snapshot, getVariables } = buildPm(
    options.request,
    options.variables,
    options.environment,
    options.requestName,
    'test',
    options.response,
    tests
  );

  let error: string | null = null;
  try {
    await runScript(options.script, pm, consoleApi, timeout);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return {
    request: snapshot(),
    variables: getVariables(),
    logs,
    error,
    tests,
    testsPassed: tests.filter((t) => t.passed).length,
    testsFailed: tests.filter((t) => !t.passed).length,
  };
};
