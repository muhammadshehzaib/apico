'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { useCollections } from '@/hooks/useCollections';
import { CommandPalette, CommandPaletteItem } from '@/components/ui/CommandPalette';
import { PinnedTabs } from '@/components/request/PinnedTabs';

export function RequestBuilder() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteResults, setPaletteResults] = useState<SavedRequest[]>([]);
  const [isPaletteSearching, setIsPaletteSearching] = useState(false);
  const [pinnedRequests, setPinnedRequests] = useState<SavedRequest[]>([]);
  const [activeSavedRequestId, setActiveSavedRequestId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

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
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const { collections, searchRequests } = useCollections(activeWorkspaceId);

  const {
    method,
    url,
    headers,
    params,
    body,
    bodyType,
    formDataFields,
    formDataFiles,
    auth,
    preRequestScript,
    postResponseScript,
    activeTab,
    isLoading,
    response,
    previousResponse,
    responseHistory,
    error,
    urlError,
    activeVariables,
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

    // Detect form-data serialized body
    const rawBody = request.body || '';
    let detectedBodyType: import('@/types').BodyType = 'json';
    let loadedBody = rawBody;
    let loadedFormDataFields: import('@/types').FormDataField[] = [{ key: '', type: 'text', value: '', enabled: true }];

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        if (parsed.__bodyType === 'form-data' && Array.isArray(parsed.fields)) {
          detectedBodyType = 'form-data';
          loadedFormDataFields = parsed.fields;
          loadedBody = '';
        }
      } catch {
        // Not form-data envelope
      }
    }

    setBody(loadedBody);
    setBodyType(detectedBodyType);
    setFormDataFields(loadedFormDataFields);
    setFormDataFiles(new Map());

    if ('auth' in request) {
      setAuth((request as SavedRequest).auth || { type: 'none' });
    }
    if ('collectionId' in request) {
      setActiveSavedRequestId(request.id);
    } else {
      setActiveSavedRequestId(null);
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

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const key = `apico_pinned_requests_${activeWorkspaceId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedRequest[];
        setPinnedRequests(parsed);
      } else {
        setPinnedRequests([]);
      }
    } catch {
      setPinnedRequests([]);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const key = `apico_pinned_requests_${activeWorkspaceId}`;
    try {
      localStorage.setItem(key, JSON.stringify(pinnedRequests));
    } catch {
      // ignore
    }
  }, [activeWorkspaceId, pinnedRequests]);

  useEffect(() => {
    if (!isPaletteOpen) return;
    const query = paletteQuery.trim();
    if (!query) {
      setPaletteResults([]);
      return;
    }

    setIsPaletteSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchRequests({ q: query });
        setPaletteResults(results || []);
      } catch {
        setPaletteResults([]);
      } finally {
        setIsPaletteSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isPaletteOpen, paletteQuery, searchRequests]);

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
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, resetAll]);

  const handleSendRequest = useCallback(async () => {
    await sendRequest();
    // Refresh history after sending (no-op if unauthenticated)
    fetchHistory();
  }, [sendRequest, fetchHistory]);

  const pinRequest = (request: SavedRequest) => {
    setPinnedRequests((prev) => {
      if (prev.find((item) => item.id === request.id)) return prev;
      return [request, ...prev];
    });
  };

  const unpinRequest = (id: string) => {
    setPinnedRequests((prev) => prev.filter((item) => item.id !== id));
  };

  const togglePinRequest = (request: SavedRequest) => {
    if (pinnedRequests.find((item) => item.id === request.id)) {
      unpinRequest(request.id);
    } else {
      pinRequest(request);
    }
  };

  const pinnedRequestIds = new Set(pinnedRequests.map((item) => item.id));

  const paletteItems: CommandPaletteItem[] = (() => {
    const query = paletteQuery.trim().toLowerCase();
    const pinnedMap = new Set(pinnedRequests.map((item) => item.id));

    const requestItems = (query ? paletteResults : pinnedRequests).map((request) => ({
      id: request.id,
      type: 'request' as const,
      title: request.name,
      subtitle: `${request.method} ${request.url}`,
      pinned: pinnedMap.has(request.id),
      data: request,
    }));

    const collectionItems = collections
      .filter((collection) => {
        if (!query) return false;
        return collection.name.toLowerCase().includes(query);
      })
      .slice(0, 10)
      .map((collection) => ({
        id: collection.id,
        type: 'collection' as const,
        title: collection.name,
        subtitle: 'Collection',
        data: collection,
      }));

    return [...requestItems, ...collectionItems];
  })();

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
            headers: headers,
            params: params,
            body: bodyType === 'form-data'
              ? JSON.stringify({ __bodyType: 'form-data', fields: formDataFields })
              : body,
            auth: auth,
          } as any}
          onSaveRequest={handleSaveRequest}
          pinnedRequestIds={pinnedRequestIds}
          onTogglePinRequest={togglePinRequest}
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
            onSend={handleSendRequest}
            onCurlImport={() => setIsCurlModalOpen(true)}
            environments={environments}
            activeEnvironment={activeEnvironment}
            onEnvironmentSelect={setActiveEnvironment}
            onManageEnvironments={openEnvironmentManager}
          />
        </ErrorBoundary>

        <PinnedTabs
          items={pinnedRequests}
          activeId={activeSavedRequestId}
          onSelect={(request) => {
            handleLoadRequest(request);
            setActiveSavedRequestId(request.id);
          }}
          onUnpin={unpinRequest}
        />

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
                  bodyType={bodyType}
                  onBodyTypeChange={setBodyType}
                  formDataFields={formDataFields}
                  onFormDataFieldsChange={setFormDataFields}
                  formDataFiles={formDataFiles}
                  onFormDataFilesChange={setFormDataFiles}
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

      <CommandPalette
        isOpen={isPaletteOpen}
        query={paletteQuery}
        items={isPaletteSearching ? [] : paletteItems}
        isLoading={isPaletteSearching}
        onQueryChange={setPaletteQuery}
        onClose={() => {
          setIsPaletteOpen(false);
          setPaletteQuery('');
        }}
        onSelect={(item) => {
          if (item.type === 'request') {
            handleLoadRequest(item.data as SavedRequest);
            setActiveSavedRequestId(item.id);
          } else {
            if (activeWorkspaceId) {
              router.push(`/workspace/${activeWorkspaceId}/collection/${item.id}`);
            }
          }
          setIsPaletteOpen(false);
        }}
        onTogglePin={(item) => {
          if (item.type !== 'request') return;
          const request = item.data as SavedRequest;
          if (pinnedRequests.find((r) => r.id === request.id)) {
            unpinRequest(request.id);
          } else {
            pinRequest(request);
          }
        }}
      />
    </div>
  );
}
