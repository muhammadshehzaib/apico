'use client';

import { useEffect } from 'react';
import { useRequestHistory } from '@/hooks/useRequestHistory';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';
import { formatTimeAgo, truncateUrl } from '@/utils/format.util';
import { HTTP_METHOD_TAILWIND } from '@/constants/app.constants';
import { HttpMethod } from '@/types';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success/20 text-success border-success/40',
  POST: 'bg-accent/20 text-accent border-accent/40',
  PUT: 'bg-warning/20 text-warning border-warning/40',
  PATCH: 'bg-info/20 text-info border-info/40',
  DELETE: 'bg-danger/20 text-danger border-danger/40',
};

export default function HistoryPage() {
  const router = useRouter();
  const { history, isLoading, fetchHistory, deleteEntry, clearAll } = useRequestHistory();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadRequest = (item: any) => {
    // In a real app, you'd load this into the request builder state
    router.push('/request');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold font-heading">History</h1>
        <button
          onClick={clearAll}
          className="text-text-muted hover:text-danger text-sm font-medium transition-colors"
          disabled={history.length === 0}
        >
          Clear History
        </button>
      </div>

      <div className="bg-bg-secondary/80 border border-bg-tertiary/60 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        {isLoading ? (
          <div className="p-6">
            <SkeletonGroup type="list-item" count={5} />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon="🕒"
            title="No History Yet"
            description="Your recent requests will appear here for quick access."
            action={{
              label: 'New Request',
              onClick: () => router.push('/request'),
            }}
          />
        ) : (
          <div className="divide-y divide-bg-tertiary/60">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-bg-tertiary/40 transition-colors group"
              >
                <button
                  onClick={() => handleLoadRequest(item)}
                  className="flex items-center gap-4 flex-1 text-left"
                >
                  <span
                    className={`${methodColors[item.method]} border text-xs font-bold px-2 py-1 rounded-md min-w-[50px] text-center`}
                  >
                    {item.method}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-text-primary truncate">
                      {truncateUrl(item.url, 60)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatTimeAgo(item.createdAt)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => deleteEntry(item.id)}
                  className="p-2 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from history"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
