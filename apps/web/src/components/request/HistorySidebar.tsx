'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
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

interface HistorySidebarProps {
  history: RequestHistory[];
  onNewRequest: () => void;
  onLoadRequest: (request: RequestHistory | SavedRequest) => void;
  isLoading: boolean;
  currentRequest: { method: string; url: string };
  onSaveRequest: (collectionId: string, data: SaveRequestInput) => Promise<void | SavedRequest>;
  pinnedRequestIds?: Set<string>;
  onTogglePinRequest?: (request: SavedRequest) => void;
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
}: HistorySidebarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [methodFilters, setMethodFilters] = useState<Set<HttpMethod>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '3xx' | '4xx' | '5xx'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const { showToast, ...toastProps } = useToast();
  const activeWorkspaceId = useSelector(
    (state: RootState) => state.workspace.activeWorkspaceId
  );
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

      const requestData: SaveRequestInput = {
        name,
        method: currentRequest.method as any,
        url: currentRequest.url,
        headers,
        params,
        body,
        auth,
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
    <aside className="w-72 bg-bg-secondary/90 border-r border-bg-tertiary/60 h-screen flex flex-col overflow-hidden backdrop-blur">
      {/* Header */}
      <div className="p-6 border-b border-bg-tertiary/60 flex-shrink-0 space-y-4">
        <Link 
          href="/workspace" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-accent transition-colors group"
        >
          <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
          Back to Workspaces
        </Link>
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
      <div className="flex-1 overflow-auto border-b border-bg-tertiary/60">
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

      {/* Collections Section */}
      <div className="flex-1 overflow-auto">
        <CollectionsSidebar
          workspaceId={activeWorkspaceId}
          onLoadRequest={onLoadRequest}
          currentRequest={currentRequest}
          onSaveRequest={() => setSaveModalOpen(true)}
          pinnedRequestIds={pinnedRequestIds}
          onTogglePinRequest={onTogglePinRequest}
        />
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
