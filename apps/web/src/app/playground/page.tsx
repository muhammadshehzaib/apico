'use client';

import { useState, useEffect } from 'react';
import { PlaygroundHeader } from '@/components/playground/PlaygroundHeader';
import { PlaygroundSidebar } from '@/components/playground/PlaygroundSidebar';
import { UrlBar } from '@/components/request/UrlBar';
import { RequestTabs } from '@/components/request/RequestTabs';
import { ResponsePanel } from '@/components/request/ResponsePanel';
import { CurlImportModal } from '@/components/request/CurlImportModal';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { UpgradePrompt } from '@/components/playground/UpgradePrompt';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useRequestBuilder } from '@/hooks/useRequestBuilder';
import { usePlaygroundHistory } from '@/hooks/usePlaygroundHistory';
import { usePlaygroundEnvironment } from '@/hooks/usePlaygroundEnvironment';
import { useToast } from '@/hooks/useToast';
import { saveGuestLastRequest } from '@/utils/playground.storage';
import type { ParsedCurl } from '@/utils/curl.parser';

export default function PlaygroundPage() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const { showToast } = useToast();

  const {
    method,
    url,
    headers,
    params,
    body,
    auth,
    activeTab,
    isLoading,
    response,
    error,
    urlError,
    setMethod,
    setUrl,
    setHeaders,
    setParams,
    setBody,
    setAuth,
    setActiveTab,
    setActiveVariables,
    sendRequest: originalSendRequest,
    resetAll,
    loadFromCurl,
  } = useRequestBuilder();

  const { history, addEntry, deleteEntry, clearAll } = usePlaygroundHistory();
  const {
    environments,
    activeEnvironment,
    setActiveEnvironment,
    openManager: openEnvironmentManager,
  } = usePlaygroundEnvironment();

  // Sync active environment variables
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

  // Wrap sendRequest to save to history
  const sendRequest = async () => {
    await originalSendRequest();

    // After successful send, add to history
    setTimeout(() => {
      if (response) {
        addEntry({
          method,
          url,
          headers,
          params,
          body,
          statusCode: response.statusCode,
          duration: response.duration,
          size: response.size,
        });

        // Save last request for potential login carry-over
        saveGuestLastRequest({
          method,
          url,
          headers,
          params,
          body,
          auth,
        });
      }
    }, 100);
  };

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <PlaygroundHeader />

      <div className="flex flex-1 overflow-hidden">
        <ErrorBoundary>
          <PlaygroundSidebar
            history={history}
            onNewRequest={resetAll}
            onLoadRequest={(entry) => {
              setMethod(entry.method);
              setUrl(entry.url);
              setHeaders(
                entry.headers.length > 0
                  ? entry.headers
                  : [{ key: '', value: '', enabled: true }]
              );
              setParams(
                entry.params.length > 0
                  ? entry.params
                  : [{ key: '', value: '', enabled: true }]
              );
              setBody(entry.body || '');
            }}
            onClearHistory={clearAll}
            onDeleteHistoryEntry={deleteEntry}
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
      </div>

      <CurlImportModal
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        onImport={(parsed: ParsedCurl) => {
          loadFromCurl(parsed);
          setIsCurlModalOpen(false);
          showToast('Request imported from curl!', 'success');
        }}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <UpgradePrompt
        feature="save requests"
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
      />
    </div>
  );
}
