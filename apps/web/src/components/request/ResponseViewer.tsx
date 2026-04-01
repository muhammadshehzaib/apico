'use client';

import { useState } from 'react';
import { JsonTreeViewer } from '@/components/json/JsonTreeViewer';

interface ResponseViewerProps {
  body: string;
  headers: Record<string, string | string[]>;
  previousBody?: string | null;
  previousHeaders?: Record<string, string | string[]> | null;
}

export function ResponseViewer({
  body,
  headers,
  previousBody = null,
  previousHeaders = null,
}: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'diff'>('body');
  const [diffView, setDiffView] = useState<'body' | 'headers'>('body');

  const formatJson = (value: string) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  const formatHeaders = (value: Record<string, string | string[]>) => {
    return JSON.stringify(value, null, 2);
  };

  const getDiffLines = (prevText: string, nextText: string) => {
    const left = prevText.split('\n');
    const right = nextText.split('\n');
    const max = Math.max(left.length, right.length);
    const lines = [];
    for (let i = 0; i < max; i += 1) {
      lines.push({
        left: left[i] ?? '',
        right: right[i] ?? '',
        changed: (left[i] ?? '') !== (right[i] ?? ''),
      });
    }
    return lines;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-bg-tertiary">
        <button
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'body'
              ? 'text-text-primary border-accent'
              : 'text-text-muted border-transparent hover:text-text-primary'
          }`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'headers'
              ? 'text-text-primary border-accent'
              : 'text-text-muted border-transparent hover:text-text-primary'
          }`}
        >
          Headers
        </button>
        <button
          onClick={() => setActiveTab('diff')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'diff'
              ? 'text-text-primary border-accent'
              : 'text-text-muted border-transparent hover:text-text-primary'
          }`}
        >
          Diff
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'body' && (
          <JsonTreeViewer body={body} headers={headers} />
        )}

        {activeTab === 'headers' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {Object.entries(headers).map(([key, value], index) => (
                <div
                  key={key}
                  className={`flex gap-4 p-2 rounded ${
                    index % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'
                  }`}
                >
                  <div className="font-mono text-sm text-text-muted font-semibold flex-shrink-0">
                    {key}
                  </div>
                  <div className="font-mono text-sm text-text-primary break-all">
                    {Array.isArray(value) ? value.join(', ') : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diff' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-bg-tertiary/60 bg-bg-secondary/60">
              <button
                onClick={() => setDiffView('body')}
                className={`text-xs px-2 py-1 rounded-md border ${
                  diffView === 'body'
                    ? 'bg-accent/20 text-accent border-accent/40'
                    : 'bg-bg-tertiary/60 text-text-muted border-stroke'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setDiffView('headers')}
                className={`text-xs px-2 py-1 rounded-md border ${
                  diffView === 'headers'
                    ? 'bg-accent/20 text-accent border-accent/40'
                    : 'bg-bg-tertiary/60 text-text-muted border-stroke'
                }`}
              >
                Headers
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {!previousBody && diffView === 'body' ? (
                <div className="text-xs text-text-muted">No previous response to compare.</div>
              ) : !previousHeaders && diffView === 'headers' ? (
                <div className="text-xs text-text-muted">No previous headers to compare.</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  {getDiffLines(
                    diffView === 'body'
                      ? formatJson(previousBody || '')
                      : formatHeaders(previousHeaders || {}),
                    diffView === 'body' ? formatJson(body) : formatHeaders(headers)
                  ).map((line, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 col-span-2">
                      <div
                        className={`px-2 py-0.5 rounded ${
                          line.changed ? 'bg-danger/10' : 'bg-transparent'
                        }`}
                      >
                        {line.left}
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded ${
                          line.changed ? 'bg-success/10' : 'bg-transparent'
                        }`}
                      >
                        {line.right}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
