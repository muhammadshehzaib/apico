'use client';

import { useState } from 'react';
import { JsonTreeViewer } from '@/components/json/JsonTreeViewer';

interface ResponseViewerProps {
  body: string;
  headers: Record<string, string | string[]>;
}

export function ResponseViewer({ body, headers }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

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
      </div>
    </div>
  );
}
