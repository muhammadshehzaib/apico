'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { workspaceService } from '@/services/workspace.service';
import { PendingInviteForUser, WorkspaceRole } from '@/types';

interface PendingInvitesBannerProps {
  onInviteAccepted?: () => void;
}

const roleBadgeVariant = (role: WorkspaceRole) => {
  switch (role) {
    case WorkspaceRole.OWNER:
      return 'success' as const;
    case WorkspaceRole.EDITOR:
      return 'info' as const;
    case WorkspaceRole.VIEWER:
      return 'default' as const;
  }
};

export function PendingInvitesBanner({ onInviteAccepted }: PendingInvitesBannerProps) {
  const [invites, setInvites] = useState<PendingInviteForUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTokens, setProcessingTokens] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const data = await workspaceService.getUserPendingInvites();
        setInvites(data);
      } catch (error) {
        console.error('Failed to fetch pending invites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvites();
  }, []);

  const handleAccept = async (token: string) => {
    setProcessingTokens((prev) => new Set(prev).add(token));
    try {
      await workspaceService.acceptWorkspaceInvite(token);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      showToast('Invite accepted! Workspace added.', 'success');
      onInviteAccepted?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to accept invite', 'error');
    } finally {
      setProcessingTokens((prev) => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  const handleDecline = async (token: string) => {
    setProcessingTokens((prev) => new Set(prev).add(token));
    try {
      await workspaceService.declineWorkspaceInvite(token);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      showToast('Invite declined', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to decline invite', 'error');
    } finally {
      setProcessingTokens((prev) => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  if (isLoading) return null;
  if (invites.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">
        Pending Invitations ({invites.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invites.map((invite) => {
          const isProcessing = processingTokens.has(invite.token);
          return (
            <div
              key={invite.id}
              className="bg-bg-secondary border border-bg-tertiary rounded-lg p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {invite.workspace.name}
                </h3>
                <Badge variant={roleBadgeVariant(invite.role)}>{invite.role}</Badge>
              </div>
              <p className="text-sm text-text-muted mb-1">
                Invited by {invite.invitedBy.name}
              </p>
              {invite.expiresAt && (
                <p className="text-xs text-text-muted mb-3">
                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAccept(invite.token)}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                >
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDecline(invite.token)}
                  disabled={isProcessing}
                >
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} />
    </div>
  );
}
