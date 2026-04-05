'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ClearWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function ClearWorkspaceModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ClearWorkspaceModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="bg-bg-secondary/95 border border-danger/60 rounded-2xl p-6 w-[28rem] space-y-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur"
        onKeyDown={handleKeyDown}
      >
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Workspace</div>
          <h2 className="text-lg font-semibold text-text-primary mt-1">Clear Workspace Data</h2>
          <p className="text-sm text-text-muted mt-2">
            This will delete all collections, requests, folders, and tags in this workspace.
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary" size="md" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            onClick={onConfirm}
            variant="danger"
            size="md"
            isLoading={isLoading}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
