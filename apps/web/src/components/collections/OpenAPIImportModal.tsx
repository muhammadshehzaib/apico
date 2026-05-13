'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  parseOpenAPI,
  OpenAPIParseError,
  type ParsedOpenAPI,
  type ParsedEndpoint,
} from '@/utils/openapi.parser';

interface OpenAPIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (collectionName: string, endpoints: ParsedEndpoint[]) => Promise<void>;
}

type SourceMode = 'paste' | 'url';

export function OpenAPIImportModal({ isOpen, onClose, onImport }: OpenAPIImportModalProps) {
  const [mode, setMode] = useState<SourceMode>('paste');
  const [rawInput, setRawInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('paste');
      setRawInput('');
      setUrlInput('');
      setCollectionName('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const parsed = useMemo<ParsedOpenAPI | null>(() => {
    if (!rawInput.trim()) return null;
    try {
      const result = parseOpenAPI(rawInput);
      return result;
    } catch {
      return null;
    }
  }, [rawInput]);

  const parseError = useMemo<string | null>(() => {
    if (!rawInput.trim()) return null;
    try {
      parseOpenAPI(rawInput);
      return null;
    } catch (err) {
      if (err instanceof OpenAPIParseError) return err.message;
      return err instanceof Error ? err.message : 'Unknown parse error';
    }
  }, [rawInput]);

  useEffect(() => {
    if (parsed && !collectionName) {
      setCollectionName(parsed.title);
    }
  }, [parsed, collectionName]);

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setError('Enter a URL');
      return;
    }
    setError(null);
    setFetchingUrl(true);
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) {
        setError(`Fetch failed: HTTP ${res.status}`);
        return;
      }
      const text = await res.text();
      setRawInput(text);
      setMode('paste');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    const name = collectionName.trim() || parsed.title;
    setImporting(true);
    setError(null);
    try {
      await onImport(name, parsed.endpoints);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-bg-tertiary flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Import from OpenAPI</h2>
              <p className="text-xs text-text-muted mt-1">
                Supports OpenAPI 3.x and Swagger 2.0 — JSON or YAML
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-bg-tertiary flex-shrink-0">
            <button
              onClick={() => setMode('paste')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'paste'
                  ? 'text-text-primary border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Paste JSON
            </button>
            <button
              onClick={() => setMode('url')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'url'
                  ? 'text-text-primary border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              From URL
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {mode === 'url' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  OpenAPI spec URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                    className="flex-1 bg-bg-primary border border-bg-tertiary rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                  <Button onClick={handleFetchUrl} disabled={fetchingUrl}>
                    {fetchingUrl ? 'Fetching…' : 'Fetch'}
                  </Button>
                </div>
                <p className="text-xs text-text-muted">
                  The server must allow CORS, or paste the JSON manually instead.
                </p>
              </div>
            )}

            {mode === 'paste' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Paste your OpenAPI/Swagger spec (JSON or YAML)
                </label>
                <textarea
                  autoFocus
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={'{ "openapi": "3.0.0", ... }\n— or —\nopenapi: 3.0.0\ninfo:\n  title: ...'}
                  className="w-full h-48 bg-bg-primary border border-bg-tertiary rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
            )}

            {parseError && (
              <div className="bg-red-500/10 border border-red-500/40 rounded px-3 py-2 text-sm text-red-400">
                {parseError}
              </div>
            )}

            {parsed && (
              <div className="space-y-3">
                <div className="bg-bg-primary rounded p-3 border border-bg-tertiary">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{parsed.title}</div>
                      <div className="text-xs text-text-muted">
                        v{parsed.version}
                        {parsed.baseUrl ? ` · ${parsed.baseUrl}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent">
                        {parsed.endpoints.length}
                      </div>
                      <div className="text-xs text-text-muted">endpoints</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    New collection name
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="w-full bg-bg-primary border border-bg-tertiary rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="bg-bg-primary border border-bg-tertiary rounded max-h-48 overflow-auto">
                  {parsed.endpoints.slice(0, 50).map((ep, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-1.5 border-b border-bg-tertiary last:border-b-0"
                    >
                      <Badge variant="default" className="text-xs uppercase font-mono">
                        {ep.method}
                      </Badge>
                      <span className="text-sm text-text-primary truncate flex-1">{ep.name}</span>
                      {ep.tag && (
                        <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
                          {ep.tag}
                        </span>
                      )}
                    </div>
                  ))}
                  {parsed.endpoints.length > 50 && (
                    <div className="px-3 py-2 text-xs text-text-muted italic">
                      + {parsed.endpoints.length - 50} more…
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-bg-tertiary flex justify-end gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!parsed || importing}>
              {importing
                ? 'Importing…'
                : parsed
                  ? `Import ${parsed.endpoints.length} request${parsed.endpoints.length === 1 ? '' : 's'}`
                  : 'Import'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
