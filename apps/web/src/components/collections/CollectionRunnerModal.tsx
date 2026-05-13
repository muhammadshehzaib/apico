'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useCollectionRunner, type RunStatus } from '@/hooks/useCollectionRunner';
import type { SavedRequest } from '@/types';
import type { EnvironmentVariable } from '@/utils/variable.util';

interface CollectionRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  requests: SavedRequest[];
  environmentVars: EnvironmentVariable[];
}

const STATUS_STYLE: Record<RunStatus, { label: string; cls: string; icon: string }> = {
  pending: { label: 'Pending', cls: 'text-text-muted', icon: '○' },
  running: { label: 'Running', cls: 'text-blue-400', icon: '⏳' },
  passed: { label: 'Passed', cls: 'text-green-400', icon: '✓' },
  failed: { label: 'Failed', cls: 'text-red-400', icon: '✗' },
  errored: { label: 'Errored', cls: 'text-orange-400', icon: '⚠' },
  skipped: { label: 'Skipped', cls: 'text-text-muted', icon: '–' },
};

export function CollectionRunnerModal({
  isOpen,
  onClose,
  collectionName,
  requests,
  environmentVars,
}: CollectionRunnerModalProps) {
  const { isRunning, results, summary, run, stop, reset } = useCollectionRunner();

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (isOpen && requests.length > 0 && !isRunning && results.length === 0) {
      void run(requests, environmentVars);
    }
  }, [isOpen, requests, environmentVars, isRunning, results.length, run]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRunning) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isRunning, onClose]);

  if (!isOpen) return null;

  const progressPct = summary && summary.total > 0
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;

  const elapsedMs = summary
    ? (summary.finishedAt ?? Date.now()) - summary.startedAt
    : 0;

  return (
    <>
      <div
        onClick={isRunning ? undefined : onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-bg-tertiary flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Running: {collectionName}</h2>
              <p className="text-xs text-text-muted mt-1">
                {requests.length} request{requests.length === 1 ? '' : 's'} · variables propagate via scripts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button variant="danger" onClick={stop}>
                  Stop
                </Button>
              ) : (
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary text-2xl font-bold transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Summary bar */}
          {summary && (
            <div className="px-6 py-4 border-b border-bg-tertiary bg-bg-primary/40 flex-shrink-0">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <div className="text-xs text-text-muted">Progress</div>
                  <div className="font-mono text-text-primary">
                    {summary.completed} / {summary.total} ({progressPct}%)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Passed</div>
                  <div className="font-mono text-green-400">{summary.passed}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Failed</div>
                  <div className="font-mono text-red-400">{summary.failed}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Errored</div>
                  <div className="font-mono text-orange-400">{summary.errored}</div>
                </div>
                {summary.totalTests > 0 && (
                  <div>
                    <div className="text-xs text-text-muted">Test assertions</div>
                    <div className="font-mono text-text-primary">
                      <span className="text-green-400">{summary.totalTestsPassed}</span>
                      {' / '}
                      <span className="text-text-primary">{summary.totalTests}</span>
                    </div>
                  </div>
                )}
                <div className="ml-auto">
                  <div className="text-xs text-text-muted">Elapsed</div>
                  <div className="font-mono text-text-primary">{(elapsedMs / 1000).toFixed(1)}s</div>
                </div>
              </div>
              <div className="mt-2 w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Results list */}
          <div className="flex-1 overflow-auto p-2">
            {results.map((r) => {
              const style = STATUS_STYLE[r.status];
              return (
                <div
                  key={r.requestId}
                  className="flex items-start gap-3 px-3 py-2 rounded hover:bg-bg-primary/50 transition-colors"
                >
                  <span className={`${style.cls} font-mono text-base mt-0.5 w-4 text-center flex-shrink-0`}>
                    {style.icon}
                  </span>
                  <span className="text-xs font-mono uppercase text-text-muted w-14 mt-0.5 flex-shrink-0">
                    {r.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{r.name}</div>
                    {r.errorMessage && (
                      <div className="text-xs text-red-400 mt-0.5">{r.errorMessage}</div>
                    )}
                    {r.tests.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {r.tests.map((t, ti) => (
                          <div
                            key={ti}
                            className={`text-xs flex items-start gap-1.5 ${
                              t.passed ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            <span className="font-mono mt-0.5">{t.passed ? '✓' : '✗'}</span>
                            <span className="flex-1">
                              {t.name}
                              {!t.passed && t.error ? ` — ${t.error}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-xs font-mono text-text-muted flex-shrink-0">
                    {r.statusCode !== undefined && (
                      <span
                        className={
                          r.statusCode >= 200 && r.statusCode < 300
                            ? 'text-green-400'
                            : r.statusCode >= 400
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }
                      >
                        {r.statusCode}
                      </span>
                    )}
                    {r.duration !== undefined && <span>{r.duration}ms</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {summary?.finishedAt && (
            <div className="p-4 border-t border-bg-tertiary flex justify-end gap-2 flex-shrink-0">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  reset();
                  void run(requests, environmentVars);
                }}
              >
                Run again
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
