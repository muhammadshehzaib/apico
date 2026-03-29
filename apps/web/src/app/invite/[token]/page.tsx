'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { workspaceService } from '@/services/workspace.service';
import { WorkspaceInvite, WorkspaceInviteStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';

export default function WorkspaceInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || '';
  const [invite, setInvite] = useState<WorkspaceInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!token) {
          setError('Invite not found');
          return;
        }
        const data = await workspaceService.getWorkspaceInvite(token);
        if (!data) {
          setError('Invite not found');
          return;
        }
        setInvite(data);
      } catch {
        setError('Failed to load invite');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    try {
      await workspaceService.acceptWorkspaceInvite(token);
      if (invite?.workspace?.id) {
        router.push(`/workspace/${invite.workspace.id}`);
      } else {
        router.push('/workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setIsAccepting(false);
    }
  };

  const renderStatus = () => {
    if (!invite) return null;
    switch (invite.status) {
      case WorkspaceInviteStatus.PENDING:
        return 'Pending';
      case WorkspaceInviteStatus.ACCEPTED:
        return 'Accepted';
      case WorkspaceInviteStatus.EXPIRED:
        return 'Expired';
      case WorkspaceInviteStatus.REVOKED:
        return 'Revoked';
      default:
        return invite.status;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workspace Invite</h1>
          <p className="text-text-muted text-sm">Accept and join a workspace</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-text-muted">Loading invite...</div>
        ) : error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : invite ? (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-text-muted">Workspace</div>
              <div className="text-lg font-semibold text-text-primary">
                {invite.workspace?.name || 'Unknown workspace'}
              </div>
            </div>

            <div className="text-sm text-text-muted">
              Invited by {invite.invitedBy?.name || 'Unknown'} ({invite.invitedBy?.email || '—'})
            </div>

            <div className="text-sm text-text-muted">
              Role: <span className="text-text-primary font-medium">{invite.role}</span>
            </div>

            <div className="text-sm text-text-muted">Status: {renderStatus()}</div>

            {invite.status === WorkspaceInviteStatus.PENDING ? (
              isAuthenticated ? (
                <Button variant="primary" size="md" onClick={handleAccept} isLoading={isAccepting}>
                  Accept Invite
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-text-muted">
                    Please log in or register to accept this invite.
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/login?redirect=/invite/${token}`}>
                      <Button variant="primary" size="md">Login</Button>
                    </Link>
                    <Link href={`/register?redirect=/invite/${token}`}>
                      <Button variant="secondary" size="md">Register</Button>
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div className="text-sm text-text-muted">
                This invite is no longer active.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
