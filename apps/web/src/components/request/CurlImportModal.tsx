'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCurlParser } from '@/hooks/useCurlParser';
import { Badge } from '@/components/ui/Badge';
import type { ParsedCurl } from '@/utils/curl.parser';

interface CurlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedCurl) => void;
}

export function CurlImportModal({
  isOpen,
  onClose,
  onImport,
}: CurlImportModalProps) {
  const { curlInput, setCurlInput, parseError, parsedPreview } =
    useCurlParser();
  const [isLoading, setIsLoading] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImport = () => {
    if (!parsedPreview || parseError) return;

    setIsLoading(true);
    try {
      onImport(parsedPreview);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-bg-tertiary flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-text-primary">
              Import from curl
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {/* Input Section */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Paste your curl command:
              </label>
              <textarea
                autoFocus
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder={`curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token" \\
  -d '{"name": "John"}'`}
                className="w-full p-3 bg-bg-primary border border-bg-tertiary rounded text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[140px] resize-none"
              />
            </div>

            {/* Preview Section */}
            {curlInput.length > 10 && (
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Preview
                </label>
                {parseError ? (
                  <div className="p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
                    {parseError}
                  </div>
                ) : parsedPreview ? (
                  <div className="space-y-2 p-3 bg-bg-primary rounded border border-bg-tertiary">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs w-16">
                        Method:
                      </span>
                      <Badge
                        variant={getMethodVariant(parsedPreview.method)}
                        className="text-xs"
                      >
                        {parsedPreview.method}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-text-muted text-xs w-16">URL:</span>
                      <code className="text-text-primary text-xs break-all font-mono">
                        {truncateUrl(parsedPreview.url, 60)}
                      </code>
                    </div>

                    {parsedPreview.headers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs w-16">
                          Headers:
                        </span>
                        <span className="text-text-primary text-xs bg-bg-tertiary px-2 py-1 rounded">
                          {parsedPreview.headers.length}{' '}
                          {parsedPreview.headers.length === 1
                            ? 'header'
                            : 'headers'}
                        </span>
                      </div>
                    )}

                    {parsedPreview.params.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs w-16">
                          Params:
                        </span>
                        <span className="text-text-primary text-xs bg-bg-tertiary px-2 py-1 rounded">
                          {parsedPreview.params.length}{' '}
                          {parsedPreview.params.length === 1 ? 'param' : 'params'}
                        </span>
                      </div>
                    )}

                    {parsedPreview.body && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs w-16">
                          Body:
                        </span>
                        <span className="text-text-primary text-xs bg-bg-tertiary px-2 py-1 rounded">
                          {isJsonBody(parsedPreview.body)
                            ? 'Yes (JSON)'
                            : 'Yes (text)'}
                        </span>
                      </div>
                    )}

                    {parsedPreview.auth.type !== 'none' && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs w-16">
                          Auth:
                        </span>
                        <span className="text-text-primary text-xs bg-bg-tertiary px-2 py-1 rounded">
                          {getAuthLabel(parsedPreview.auth)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-text-muted text-sm">
                    Paste a curl command to see a preview
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-bg-tertiary flex-shrink-0 flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleImport}
              disabled={
                !parsedPreview || !!parseError || curlInput.length === 0
              }
              isLoading={isLoading}
            >
              Import
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function getMethodVariant(
  method: string
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (method) {
    case 'GET':
      return 'success';
    case 'POST':
      return 'info';
    case 'PUT':
      return 'warning';
    case 'PATCH':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'default';
  }
}

function isJsonBody(body: string): boolean {
  return body.trim().startsWith('{') || body.trim().startsWith('[');
}

function getAuthLabel(
  auth: any
): string {
  if (auth.type === 'bearer') {
    return 'Bearer Token';
  }
  if (auth.type === 'basic') {
    return 'Basic Auth';
  }
  return 'None';
}

function truncateUrl(url: string, maxLength: number): string {
  if (url.length > maxLength) {
    return url.substring(0, maxLength) + '...';
  }
  return url;
}
