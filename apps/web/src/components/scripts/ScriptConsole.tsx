'use client';

import { useEffect, useRef } from 'react';
import type { ConsoleLine } from '@/utils/sandbox/pm.context';

interface ScriptConsoleProps {
  logs: ConsoleLine[];
  error: string | null;
  isRunning: boolean;
  lastRunDuration: number | null;
  onClear: () => void;
}

const getLogIcon = (type: string): { icon: string; color: string } => {
  switch (type) {
    case 'log':
      return { icon: '>', color: 'text-gray-400' };
    case 'warn':
      return { icon: '⚠', color: 'text-yellow-500' };
    case 'error':
      return { icon: '✕', color: 'text-red-500' };
    case 'info':
      return { icon: 'ℹ', color: 'text-blue-400' };
    default:
      return { icon: '•', color: 'text-gray-400' };
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as any);
};

export function ScriptConsole({
  logs,
  error,
  isRunning,
  lastRunDuration,
  onClear,
}: ScriptConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, error]);

  const hasContent = logs.length > 0 || error;

  return (
    <div className="flex flex-col h-full border-b border-bg-tertiary">
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary bg-bg-secondary">
        <span className="text-sm font-medium text-text-primary">Console</span>

        <div className="flex items-center gap-2">
          {lastRunDuration !== null && !isRunning && (
            <span className="text-xs px-2 py-1 rounded bg-green-900 bg-opacity-30 text-green-400">
              ran in {lastRunDuration}ms
            </span>
          )}
          {isRunning && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-900 bg-opacity-30 text-yellow-400">
              running...
            </span>
          )}
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            title="Clear console"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 bg-bg-primary font-mono text-xs">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <div className="text-sm">No output yet</div>
            <div className="text-xs mt-1">Console logs will appear here when the script runs</div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => {
              const { icon, color } = getLogIcon(log.type);
              const time = formatTime(log.timestamp);

              return (
                <div key={idx} className="flex gap-2">
                  <span className={`w-4 flex-shrink-0 ${color}`}>{icon}</span>
                  <span className="flex-1 text-text-primary break-all">{log.message}</span>
                  <span className="text-text-muted flex-shrink-0">{time}</span>
                </div>
              );
            })}

            {error && (
              <div className="mt-3 p-2 rounded bg-red-900 bg-opacity-30 border border-red-700 border-opacity-30">
                <div className="text-red-400 text-xs font-medium">✕ Script Error</div>
                <div className="text-red-300 text-xs mt-1">{error}</div>
              </div>
            )}

            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
