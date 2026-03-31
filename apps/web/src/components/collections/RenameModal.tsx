'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  currentName: string;
  title: string;
  isLoading?: boolean;
}

export function RenameModal({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  title,
  isLoading = false,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isOpen, currentName]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await onConfirm(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename');
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
      <div className="bg-bg-secondary/95 border border-stroke rounded-2xl p-6 w-96 space-y-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Rename</div>
          <h2 className="text-lg font-semibold text-text-primary mt-1">{title}</h2>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 bg-bg-primary/80 border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 text-text-primary"
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
            Rename
          </Button>
        </div>
      </div>
    </div>
  );
}
