'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Draggable divider state
  const [requestPanelHeight, setRequestPanelHeight] = useState(192);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = requestPanelHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [requestPanelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientY - dragStartY.current;
      const containerHeight = containerRef.current?.clientHeight ?? 600;
      const maxHeight = Math.floor(containerHeight * 0.8);
      const newHeight = Math.min(Math.max(dragStartHeight.current + delta, 80), maxHeight);
      setRequestPanelHeight(newHeight);
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
    previousResponse,
    responseHistory,
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

          <div className="flex-1 flex overflow-hidden" ref={containerRef}>
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="overflow-hidden" style={{ height: requestPanelHeight, flexShrink: 0 }}>
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

              {/* Draggable divider */}
              <div
                onMouseDown={handleDividerMouseDown}
                className="relative flex items-center justify-center bg-bg-tertiary/70 border-t border-b border-bg-tertiary/60 flex-shrink-0 group"
                style={{ height: 8, cursor: 'row-resize' }}
                title="Drag to resize"
              >
                <div className="w-8 h-1 rounded-full bg-text-muted opacity-40 group-hover:opacity-80 transition-opacity" />
              </div>

              <div className="flex-1 overflow-hidden">
                <ErrorBoundary>
                  <ResponsePanel
                    response={response}
                    previousResponse={previousResponse}
                    responseHistory={responseHistory}
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
