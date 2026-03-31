'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { WorkspaceRole } from '@/types';

interface InviteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, role: WorkspaceRole) => Promise<{ inviteLink?: string } | null>;
  isLoading?: boolean;
}

export function InviteWorkspaceModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: InviteWorkspaceModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>(WorkspaceRole.VIEWER);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole(WorkspaceRole.VIEWER);
      setError('');
      setInviteLink(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const result = await onConfirm(email.trim(), role);
      setInviteLink(result?.inviteLink || null);
      if (!result?.inviteLink) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      // Ignore copy errors
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
        <h2 className="text-lg font-semibold text-text-primary">Invite to Workspace</h2>
        <p className="text-xs text-text-muted">Unlimited collaborators, no time limits. Free forever.</p>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Email
          </label>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="user@example.com"
            className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
          >
            <option value={WorkspaceRole.VIEWER}>Viewer</option>
            <option value={WorkspaceRole.EDITOR}>Editor</option>
            <option value={WorkspaceRole.OWNER}>Owner</option>
          </select>
        </div>

        {inviteLink ? (
          <div className="bg-bg-primary border border-bg-tertiary rounded p-3 text-sm text-text-primary">
            <div className="mb-2">Invite link ready to share:</div>
            <div className="break-all text-text-muted">{inviteLink}</div>
            <div className="flex justify-end mt-3">
              <Button onClick={handleCopyLink} variant="secondary" size="sm">
                Copy Link
              </Button>
            </div>
          </div>
        ) : null}

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary" size="md" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="primary" size="md" isLoading={isLoading}>
            Send Invite
          </Button>
        </div>
      </div>
    </div>
  );
}
