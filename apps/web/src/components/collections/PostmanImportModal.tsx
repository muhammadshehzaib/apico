'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  parsePostman,
  PostmanParseError,
  type ParsedPostmanCollection,
  type ParsedPostmanRequest,
} from '@/utils/postman.parser';

interface PostmanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (collectionName: string, requests: ParsedPostmanRequest[]) => Promise<void>;
}

export function PostmanImportModal({ isOpen, onClose, onImport }: PostmanImportModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRawInput('');
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

  const parsed = useMemo<ParsedPostmanCollection | null>(() => {
    if (!rawInput.trim()) return null;
    try {
      return parsePostman(rawInput);
    } catch {
      return null;
    }
  }, [rawInput]);

  const parseError = useMemo<string | null>(() => {
    if (!rawInput.trim()) return null;
    try {
      parsePostman(rawInput);
      return null;
    } catch (err) {
      if (err instanceof PostmanParseError) return err.message;
      return err instanceof Error ? err.message : 'Unknown parse error';
    }
  }, [rawInput]);

  useEffect(() => {
    if (parsed && !collectionName) {
      setCollectionName(parsed.name);
    }
  }, [parsed, collectionName]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawInput(text);
  };

  const handleImport = async () => {
    if (!parsed) return;
    const name = collectionName.trim() || parsed.name;
    setImporting(true);
    setError(null);
    try {
      await onImport(name, parsed.requests);
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
              <h2 className="text-xl font-bold text-text-primary">Import from Postman</h2>
              <p className="text-xs text-text-muted mt-1">
                Supports Postman Collection v2.0 and v2.1 — pre-request and test scripts are preserved
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Upload exported `.postman_collection.json` file
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-white file:cursor-pointer hover:file:bg-accent/80"
              />
              <p className="text-xs text-text-muted mt-2">
                In Postman: right-click a collection → Export → Collection v2.1 → download.
              </p>
            </div>

            <div className="text-xs text-text-muted text-center">— or —</div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Paste the collection JSON
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder='{ "info": { "name": "...", "schema": "...v2.1.0..." }, "item": [...] }'
                className="w-full h-40 bg-bg-primary border border-bg-tertiary rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

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
                      <div className="text-sm font-semibold text-text-primary">{parsed.name}</div>
                      <div className="text-xs text-text-muted">
                        {parsed.folderCount} folder{parsed.folderCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent">{parsed.requests.length}</div>
                      <div className="text-xs text-text-muted">requests</div>
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
                  {parsed.requests.slice(0, 50).map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-1.5 border-b border-bg-tertiary last:border-b-0"
                    >
                      <Badge variant="default" className="text-xs uppercase font-mono">
                        {req.method}
                      </Badge>
                      <span className="text-sm text-text-primary truncate flex-1">{req.name}</span>
                      {req.folderPath.length > 0 && (
                        <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
                          {req.folderPath[req.folderPath.length - 1]}
                        </span>
                      )}
                      {(req.preRequestScript || req.postResponseScript) && (
                        <span className="text-xs text-accent" title="Has scripts">⚡</span>
                      )}
                    </div>
                  ))}
                  {parsed.requests.length > 50 && (
                    <div className="px-3 py-2 text-xs text-text-muted italic">
                      + {parsed.requests.length - 50} more…
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
                  ? `Import ${parsed.requests.length} request${parsed.requests.length === 1 ? '' : 's'}`
                  : 'Import'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
