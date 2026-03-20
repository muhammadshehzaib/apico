'use client';

import { KeyValuePair, RequestAuth } from '@/types';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyEditor } from './BodyEditor';
import { AuthEditor } from './AuthEditor';
import { ScriptTab } from '@/components/scripts/ScriptTab';
import type { ConsoleLine, TestResult } from '@/utils/sandbox/pm.context';

interface RequestTabsProps {
  activeTab: 'params' | 'headers' | 'body' | 'auth' | 'scripts';
  onTabChange: (tab: 'params' | 'headers' | 'body' | 'auth' | 'scripts') => void;
  params: KeyValuePair[];
  onParamsChange: (params: KeyValuePair[]) => void;
  headers: KeyValuePair[];
  onHeadersChange: (headers: KeyValuePair[]) => void;
  body: string;
  onBodyChange: (body: string) => void;
  auth: RequestAuth;
  onAuthChange: (auth: RequestAuth) => void;
  preRequestScript?: string;
  onPreRequestScriptChange?: (script: string) => void;
  consoleLogs?: ConsoleLine[];
  scriptError?: string | null;
  isScriptRunning?: boolean;
  lastRunDuration?: number | null;
  onClearLogs?: () => void;
  postResponseScript?: string;
  onPostResponseScriptChange?: (script: string) => void;
  testResults?: TestResult[];
  testsPassed?: number;
  testsFailed?: number;
  isTestRunning?: boolean;
  testError?: string | null;
  testConsoleLogs?: ConsoleLine[];
  lastTestRunDuration?: number | null;
  onClearTestResults?: () => void;
}

const getTabs = (
  params: KeyValuePair[],
  headers: KeyValuePair[],
  body: string,
  auth: RequestAuth,
  preRequestScript?: string
) => {
  const paramsCount = params.filter((p) => p.enabled && p.key.trim()).length;
  const headersCount = headers.filter((h) => h.enabled && h.key.trim()).length;
  const hasBody = body.trim().length > 0;
  const hasAuth = auth.type !== 'none';
  const hasScript = (preRequestScript || '').trim().length > 0;

  return [
    { id: 'params', label: 'Params', count: paramsCount || null },
    { id: 'headers', label: 'Headers', count: headersCount || null },
    { id: 'body', label: 'Body', hasContent: hasBody },
    { id: 'auth', label: 'Auth', hasContent: hasAuth },
    { id: 'scripts', label: 'Scripts', hasContent: hasScript },
  ];
};

export function RequestTabs({
  activeTab,
  onTabChange,
  params,
  onParamsChange,
  headers,
  onHeadersChange,
  body,
  onBodyChange,
  auth,
  onAuthChange,
  preRequestScript = '',
  onPreRequestScriptChange,
  consoleLogs = [],
  scriptError = null,
  isScriptRunning = false,
  lastRunDuration = null,
  onClearLogs,
  postResponseScript = '',
  onPostResponseScriptChange,
  testResults = [],
  testsPassed = 0,
  testsFailed = 0,
  isTestRunning = false,
  testError = null,
  testConsoleLogs = [],
  lastTestRunDuration = null,
  onClearTestResults,
}: RequestTabsProps) {
  const tabs = getTabs(params, headers, body, auth, preRequestScript);

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-b border-bg-tertiary">
      <div className="flex border-b border-bg-tertiary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === tab.id
                ? 'text-text-primary border-accent'
                : 'text-text-muted border-transparent hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.count && (
              <span className="ml-2 inline-block bg-bg-tertiary text-text-muted text-xs px-1.5 py-0.5 rounded">
                {tab.count}
              </span>
            )}
            {tab.hasContent && !tab.count && (
              <span className="ml-2 inline-block w-2 h-2 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'params' && (
          <KeyValueEditor
            pairs={params}
            onChange={onParamsChange}
            placeholder={{ key: 'Parameter', value: 'Value' }}
          />
        )}

        {activeTab === 'headers' && (
          <KeyValueEditor
            pairs={headers}
            onChange={onHeadersChange}
            placeholder={{ key: 'Header', value: 'Value' }}
          />
        )}

        {activeTab === 'body' && (
          <BodyEditor body={body} onChange={onBodyChange} />
        )}

        {activeTab === 'auth' && (
          <AuthEditor auth={auth} onChange={onAuthChange} />
        )}

        {activeTab === 'scripts' && onPreRequestScriptChange && onClearLogs && (
          <ScriptTab
            preRequestScript={preRequestScript}
            onPreRequestChange={onPreRequestScriptChange}
            consoleLogs={consoleLogs}
            scriptError={scriptError}
            isScriptRunning={isScriptRunning}
            lastRunDuration={lastRunDuration}
            onClearLogs={onClearLogs}
            postResponseScript={postResponseScript}
            onPostResponseChange={onPostResponseScriptChange}
            testResults={testResults}
            testsPassed={testsPassed}
            testsFailed={testsFailed}
            isTestRunning={isTestRunning}
            testError={testError}
            testConsoleLogs={testConsoleLogs}
            lastTestRunDuration={lastTestRunDuration}
            onClearTestResults={onClearTestResults}
          />
        )}
      </div>
    </div>
  );
}
