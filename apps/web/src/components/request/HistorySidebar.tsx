'use client';

import { useState } from 'react';
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
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success',
  POST: 'bg-accent',
  PUT: 'bg-warning',
  PATCH: 'bg-info',
  DELETE: 'bg-danger',
};

export function HistorySidebar({
  history,
  onNewRequest,
  onLoadRequest,
  isLoading,
  currentRequest,
  onSaveRequest,
}: HistorySidebarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast, ...toastProps } = useToast();
  const activeWorkspaceId = useSelector(
    (state: RootState) => state.workspace.activeWorkspaceId
  );
  const { collections } = useCollections(activeWorkspaceId);

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
    <aside className="w-72 bg-bg-secondary border-r border-bg-tertiary h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-bg-tertiary flex-shrink-0 space-y-4">
        <Link 
          href="/workspace" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-accent transition-colors group"
        >
          <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
          Back to Workspaces
        </Link>
        <h1 className="text-lg font-bold text-accent">Requester</h1>
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
      <div className="flex-1 overflow-auto border-b border-bg-tertiary">
        <div className="p-4">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            History
          </h2>

          {isLoading ? (
            <SkeletonGroup type="list-item" count={2} />
          ) : history.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">No history yet</p>
          ) : (
            <div className="space-y-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onLoadRequest(item)}
                  className="w-full text-left p-2 rounded hover:bg-bg-tertiary transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`${methodColors[item.method]} text-white text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5`}
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
