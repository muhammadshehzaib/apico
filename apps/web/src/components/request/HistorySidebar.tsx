'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { PointerEvent } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RequestHistory, HttpMethod, SavedRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { formatTimeAgo, truncateUrl } from '@/utils/format.util';
import { HTTP_METHOD_TAILWIND } from '@/constants/app.constants';
import { CollectionsSidebar } from '@/components/collections/CollectionsSidebar';
import { SaveRequestModal } from '@/components/collections/SaveRequestModal';
import { useToast } from '@/hooks/useToast';
import { RootState } from '@/store';
import { useCollections } from '@/hooks/useCollections';
import type { SaveRequestInput } from '@/validations/request.validation';
import { setActiveWorkspace, setActiveEnvironment } from '@/store/slices/workspace.slice';

interface HistorySidebarProps {
  history: RequestHistory[];
  onNewRequest: () => void;
  onLoadRequest: (request: RequestHistory | SavedRequest) => void;
  isLoading: boolean;
  currentRequest: { method: string; url: string };
  onSaveRequest: (collectionId: string, data: SaveRequestInput) => Promise<void | SavedRequest>;
  pinnedRequestIds?: Set<string>;
  onTogglePinRequest?: (request: SavedRequest) => void;
  className?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success/20 text-success border-success/40',
  POST: 'bg-accent/20 text-accent border-accent/40',
  PUT: 'bg-warning/20 text-warning border-warning/40',
  PATCH: 'bg-info/20 text-info border-info/40',
  DELETE: 'bg-danger/20 text-danger border-danger/40',
};

export function HistorySidebar({
  history,
  onNewRequest,
  onLoadRequest,
  isLoading,
  currentRequest,
  onSaveRequest,
  pinnedRequestIds,
  onTogglePinRequest,
  className = '',
}: HistorySidebarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyShare, setHistoryShare] = useState(0.5);
  const panelsRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ cursor: string; userSelect: string } | null>(null);

  const updateHistoryShare = (share: number) => {
    const value = Math.min(0.85, Math.max(0.15, share));
    setHistoryShare(value);
    try {
      localStorage.setItem('apico_history_panel_share', String(value));
    } catch { /* Resizing also works when storage is unavailable. */ }
  };

  const finishResize = () => {
    if (!resizeRef.current) return;
    document.body.style.cursor = resizeRef.current.cursor;
    document.body.style.userSelect = resizeRef.current.userSelect;
    resizeRef.current = null;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('apico_history_panel_share');
      const value = stored === null ? NaN : Number(stored);
      if (Number.isFinite(value)) setHistoryShare(Math.min(0.85, Math.max(0.15, value)));
    } catch { /* Keep the default layout. */ }
    return finishResize;
  }, []);

  const handleResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || !panelsRef.current) return;
    const bounds = panelsRef.current.getBoundingClientRect();
    if (bounds.height > 8) {
      updateHistoryShare((event.clientY - bounds.top - 4) / (bounds.height - 8));
    }
  };
  const [methodFilters, setMethodFilters] = useState<Set<HttpMethod>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '3xx' | '4xx' | '5xx'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const { showToast, ...toastProps } = useToast();
  const activeWorkspaceId = useSelector(
    (state: RootState) => state.workspace.activeWorkspaceId
  );
  const dispatch = useDispatch();
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const isWorkspaceLoading = useSelector((state: RootState) => state.workspace.isLoading);
  const { collections } = useCollections(activeWorkspaceId);

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const timeWindowMs = (() => {
      if (timeFilter === '24h') return 24 * 60 * 60 * 1000;
      if (timeFilter === '7d') return 7 * 24 * 60 * 60 * 1000;
      if (timeFilter === '30d') return 30 * 24 * 60 * 60 * 1000;
      return null;
    })();

    return history.filter((item) => {
      if (methodFilters.size > 0 && !methodFilters.has(item.method)) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (!item.statusCode) return false;
        const bucket = `${Math.floor(item.statusCode / 100)}xx`;
        if (bucket !== statusFilter) return false;
      }

      if (timeWindowMs) {
        const ts = new Date(item.createdAt).getTime();
        if (!ts || now - ts > timeWindowMs) return false;
      }

      return true;
    });
  }, [history, methodFilters, statusFilter, timeFilter]);

  const handleSaveRequest = async (collectionId: string, name: string) => {
    setIsSaving(true);
    try {
      const headers = (currentRequest as any).headers || [];
      const params = (currentRequest as any).params || [];
      const body = (currentRequest as any).body || '';
      const auth = (currentRequest as any).auth || { type: 'none' };
      const preRequestScript = (currentRequest as any).preRequestScript || '';
      const postResponseScript = (currentRequest as any).postResponseScript || '';

      const requestData: SaveRequestInput = {
        name,
        method: currentRequest.method as any,
        url: currentRequest.url,
        headers,
        params,
        body,
        auth,
        preRequestScript,
        postResponseScript,
      };

      await onSaveRequest(collectionId, requestData);
      setSaveModalOpen(false);
      showToast('Request saved!', 'success');
    } catch (err) {
      showToast('Failed to save request', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className={`w-full bg-bg-secondary/90 border-r border-bg-tertiary/60 h-screen flex flex-col overflow-hidden backdrop-blur ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-bg-tertiary/60 flex-shrink-0 space-y-4">
        <div className="space-y-2">
          <label htmlFor="request-workspace" className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.2em]">Workspace</label>
          <select
            id="request-workspace"
            value={activeWorkspaceId ?? ''}
            disabled={isWorkspaceLoading || workspaces.length === 0}
            onChange={(event) => {
              dispatch(setActiveWorkspace(event.target.value));
              dispatch(setActiveEnvironment(null));
            }}
            className="w-full min-w-0 rounded-md border border-stroke bg-bg-primary px-3 py-2 text-sm text-text-primary"
          >
            <option value="" disabled>{isWorkspaceLoading ? 'Loading workspaces...' : 'Select workspace'}</option>
            {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
          </select>
          <Link href={activeWorkspaceId ? `/workspace/${activeWorkspaceId}` : '/workspace'} className="inline-block text-xs text-text-muted hover:text-accent">
            {activeWorkspaceId ? 'Manage workspace' : 'Create a workspace'}
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-text-primary">Requester</h1>
        <div className="flex gap-2">
          <Button
            onClick={onNewRequest}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            New Request
          </Button>
          <Button
            onClick={() => setSaveModalOpen(true)}
            variant="secondary"
            size="sm"
            className="flex-1"
            title="Save current request"
          >
            Save ↓
          </Button>
        </div>
      </div>

      {/* History Section */}
      <div ref={panelsRef} className="min-h-0 flex-1 flex flex-col">
      <div id="sidebar-history" className="min-h-0 overflow-auto" style={{ flex: `${historyShare} 1 0%` }}>
        <div className="p-4">
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.2em] mb-3">
            History
          </h2>

          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {Object.values(HttpMethod).map((method) => {
                const active = methodFilters.has(method);
                return (
                  <button
                    key={method}
                    onClick={() =>
                      setMethodFilters((prev) => {
                        const next = new Set(prev);
                        if (next.has(method)) {
                          next.delete(method);
                        } else {
                          next.add(method);
                        }
                        return next;
                      })
                    }
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                      active
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-bg-tertiary/60 text-text-muted border-stroke'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-[11px] px-2 py-1 bg-bg-secondary border border-stroke rounded-md text-text-primary"
              >
                <option value="all">All Status</option>
                <option value="2xx">2xx</option>
                <option value="3xx">3xx</option>
                <option value="4xx">4xx</option>
                <option value="5xx">5xx</option>
              </select>

              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="text-[11px] px-2 py-1 bg-bg-secondary border border-stroke rounded-md text-text-primary"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7d</option>
                <option value="30d">Last 30d</option>
              </select>

              {(methodFilters.size > 0 || statusFilter !== 'all' || timeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setMethodFilters(new Set());
                    setStatusFilter('all');
                    setTimeFilter('all');
                  }}
                  className="text-[11px] text-text-muted hover:text-text-primary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <SkeletonGroup type="list-item" count={2} />
          ) : filteredHistory.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">No history yet</p>
          ) : (
            <div className="space-y-1">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onLoadRequest(item)}
                  className="w-full text-left p-2 rounded-lg hover:bg-bg-tertiary/60 transition-colors group border border-transparent hover:border-stroke/60"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`${methodColors[item.method]} border text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5`}
                    >
                      {item.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary truncate font-mono">
                        {truncateUrl(item.url, 25)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-label="Resize History and Collections"
        aria-orientation="horizontal"
        aria-controls="sidebar-history sidebar-collections"
        aria-valuemin={15}
        aria-valuemax={85}
        aria-valuenow={Math.round(historyShare * 100)}
        title="Drag up or down to resize Collections. Double-click to reset."
        className="group flex h-2 shrink-0 cursor-row-resize touch-none select-none items-center justify-center bg-bg-tertiary/70 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeRef.current = { cursor: document.body.style.cursor, userSelect: document.body.style.userSelect };
          document.body.style.cursor = 'row-resize';
          document.body.style.userSelect = 'none';
        }}
        onPointerMove={handleResizeMove}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={finishResize}
        onDoubleClick={() => updateHistoryShare(0.5)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.025;
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            updateHistoryShare(historyShare + (event.key === 'ArrowUp' ? -step : step));
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            updateHistoryShare(event.key === 'Home' ? 0.15 : 0.85);
          }
        }}
      >
        <span className="h-0.5 w-8 rounded-full bg-text-muted/50 group-hover:bg-accent" />
      </div>

      {/* Collections Section */}
      <div id="sidebar-collections" className="min-h-0 overflow-y-auto overflow-x-hidden" style={{ flex: `${1 - historyShare} 1 0%` }}>
        <CollectionsSidebar
          workspaceId={activeWorkspaceId}
          isWorkspaceLoading={isWorkspaceLoading}
          onLoadRequest={onLoadRequest}
          currentRequest={currentRequest}
          onSaveRequest={() => setSaveModalOpen(true)}
          pinnedRequestIds={pinnedRequestIds}
          onTogglePinRequest={onTogglePinRequest}
        />
      </div>
      </div>

      {/* Save Modal */}
      <SaveRequestModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveRequest}
        collections={collections}
        currentRequest={currentRequest as { method: HttpMethod; url: string }}
        isLoading={isSaving}
      />

      {/* Toast */}
      <Toast {...toastProps} />
    </aside>
  );
}
