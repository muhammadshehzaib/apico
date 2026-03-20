'use client';

import { useEffect, useState } from 'react';
import { useRequestBuilder } from '@/hooks/useRequestBuilder';
import { useRequestHistory } from '@/hooks/useRequestHistory';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RequestHistory, SavedRequest } from '@/types';
import { SaveRequestInput } from '@/validations/request.validation';
import { collectionService } from '@/services/collection.service';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { CurlImportModal } from './CurlImportModal';
import { UrlBar } from './UrlBar';
import { RequestTabs } from './RequestTabs';
import { ResponsePanel } from './ResponsePanel';
import { HistorySidebar } from './HistorySidebar';
import { useToast } from '@/hooks/useToast';

export function RequestBuilder() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const { showToast } = useToast();
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const {
    method,
    url,
    headers,
    params,
    body,
    auth,
    preRequestScript,
    postResponseScript,
    activeTab,
    isLoading,
    response,
    error,
    urlError,
    activeVariables,
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
    resetAll,
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
  } = useRequestBuilder();

  const { history, isLoading: historyLoading, fetchHistory } = useRequestHistory();
  const {
    environments,
    activeEnvironment,
    isManagerOpen,
    setActiveEnvironment,
    openManager: openEnvironmentManager,
    closeManager: closeEnvironmentManager,
  } = useEnvironment(activeWorkspaceId);

  const handleLoadRequest = (request: RequestHistory | SavedRequest) => {
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(request.headers || [{ key: '', value: '', enabled: true }]);
    setParams((request as any).params || [{ key: '', value: '', enabled: true }]);
    setBody(request.body || '');
    if ('auth' in request) {
      setAuth((request as SavedRequest).auth || { type: 'none' });
    }
  };

  const handleSaveRequest = async (collectionId: string, data: SaveRequestInput) => {
    return collectionService.saveRequest(collectionId, data);
  };

  // Sync active environment variables with request builder
  useEffect(() => {
    if (activeEnvironment) {
      setActiveVariables(activeEnvironment.variables);
    }
  }, [activeEnvironment, setActiveVariables]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show/hide keyboard shortcuts
      if (e.key === '?' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
      // New request
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        resetAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, resetAll]);

  return (
    <div className="flex h-screen bg-bg-primary">
      <ErrorBoundary>
        <HistorySidebar
          history={history}
          onNewRequest={resetAll}
          onLoadRequest={handleLoadRequest}
          isLoading={historyLoading}
          currentRequest={{
            method: method,
            url: url,
          }}
          onSaveRequest={handleSaveRequest}
        />
      </ErrorBoundary>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ErrorBoundary>
          <UrlBar
            method={method}
            url={url}
            urlError={urlError}
            isLoading={isLoading}
            onMethodChange={setMethod}
            onUrlChange={setUrl}
            onSend={sendRequest}
            onCurlImport={() => setIsCurlModalOpen(true)}
            environments={environments}
            activeEnvironment={activeEnvironment}
            onEnvironmentSelect={setActiveEnvironment}
            onManageEnvironments={openEnvironmentManager}
          />
        </ErrorBoundary>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="h-48 overflow-hidden border-b border-bg-tertiary">
              <ErrorBoundary>
                <RequestTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  params={params}
                  onParamsChange={setParams}
                  headers={headers}
                  onHeadersChange={setHeaders}
                  body={body}
                  onBodyChange={setBody}
                  auth={auth}
                  onAuthChange={setAuth}
                  preRequestScript={preRequestScript}
                  onPreRequestScriptChange={setPreRequestScript}
                  consoleLogs={consoleLogs}
                  scriptError={scriptError}
                  isScriptRunning={isScriptRunning}
                  lastRunDuration={lastRunDuration}
                  onClearLogs={clearLogs}
                  postResponseScript={postResponseScript}
                  onPostResponseScriptChange={setPostResponseScript}
                  testResults={testResults}
                  testsPassed={testsPassed}
                  testsFailed={testsFailed}
                  isTestRunning={isTestRunning}
                  testError={testError}
                  testConsoleLogs={testConsoleLogs}
                  lastTestRunDuration={lastTestRunDuration}
                  onClearTestResults={clearTestResults}
                />
              </ErrorBoundary>
            </div>

            <div className="flex-1 overflow-hidden">
              <ErrorBoundary>
                <ResponsePanel
                  response={response}
                  isLoading={isLoading}
                  error={error}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <CurlImportModal
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        onImport={(parsed) => {
          loadFromCurl(parsed);
          setIsCurlModalOpen(false);
          showToast('Request imported from curl!', 'success');
        }}
      />
    </div>
  );
}
