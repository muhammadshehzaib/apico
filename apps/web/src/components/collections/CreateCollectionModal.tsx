'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await onConfirm(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 w-96 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">New Collection</h2>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Collection name"
          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
        />

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="md"
            isLoading={isLoading}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
