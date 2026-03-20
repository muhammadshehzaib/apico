'use client';

import { useState, useRef, useEffect } from 'react';
import { Collection, HttpMethod } from '@/types';
import { Button } from '@/components/ui/Button';

interface SaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId: string, name: string) => Promise<void>;
  collections: Collection[];
  currentRequest: {
    method: HttpMethod;
    url: string;
  };
  isLoading?: boolean;
}

export function SaveRequestModal({
  isOpen,
  onClose,
  onSave,
  collections,
  currentRequest,
  isLoading = false,
}: SaveRequestModalProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-fill name from URL path
      try {
        const url = new URL(currentRequest.url);
        const pathname = url.pathname || '/';
        setName(`${currentRequest.method} ${pathname}`);
      } catch {
        setName(`${currentRequest.method} ${currentRequest.url}`);
      }

      setError('');
      setSelectedCollectionId(collections[0]?.id || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, currentRequest, collections]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Request name is required');
      return;
    }

    if (!selectedCollectionId) {
      setError('Please select a collection');
      return;
    }

    try {
      await onSave(selectedCollectionId, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save request');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 w-96 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Save Request</h2>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Request Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Request name"
            className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Collection
          </label>
          {collections.length === 0 ? (
            <div className="text-text-muted text-sm p-3 bg-bg-primary rounded border border-bg-tertiary">
              No collections yet. Create one first.
            </div>
          ) : (
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
            >
              <option value="">Select a collection...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isLoading || collections.length === 0}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={collections.length === 0}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
