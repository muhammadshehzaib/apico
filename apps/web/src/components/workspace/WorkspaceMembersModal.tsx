'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { workspaceService } from '@/services/workspace.service';
import { WorkspaceMemberWithUser, WorkspacePendingInvite, WorkspaceRole } from '@/types';

interface WorkspaceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserRole: WorkspaceRole;
  currentUserId: string;
}

const roleBadgeVariant = (role: WorkspaceRole) => {
  switch (role) {
    case WorkspaceRole.OWNER:
      return 'success';
    case WorkspaceRole.EDITOR:
      return 'info';
    case WorkspaceRole.VIEWER:
      return 'default';
  }
};

export function WorkspaceMembersModal({
  isOpen,
  onClose,
  workspaceId,
  currentUserRole,
  currentUserId,
}: WorkspaceMembersModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([]);
  const [invites, setInvites] = useState<WorkspacePendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const isOwner = currentUserRole === WorkspaceRole.OWNER;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab('members');
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const membersData = await workspaceService.getWorkspaceMembers(workspaceId);
      setMembers(membersData);

      if (isOwner) {
        const invitesData = await workspaceService.getWorkspaceInvites(workspaceId);
        setInvites(invitesData);
      }
    } catch (error) {
      console.error('Failed to fetch workspace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await workspaceService.updateMemberRole(workspaceId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole as WorkspaceRole } : m))
      );
      showToast('Role updated successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;

    try {
      await workspaceService.removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      showToast('Member removed successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove member', 'error');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await workspaceService.revokeInvite(workspaceId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast('Invite revoked successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to revoke invite', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 w-[540px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Workspace Members</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-bg-tertiary">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Members ({members.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invites'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Pending Invites ({invites.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : activeTab === 'members' ? (
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">No members found</p>
              ) : (
                members.map((member) => {
                  const isSelf = member.userId === currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-bg-tertiary"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {member.user.name}
                          </span>
                          {isSelf && (
                            <span className="text-xs text-text-muted">(you)</span>
                          )}
                          <Badge variant={roleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted truncate">{member.user.email}</p>
                      </div>

                      {isOwner && !isSelf && member.role !== WorkspaceRole.OWNER && (
                        <div className="flex items-center gap-2 ml-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            className="px-2 py-1 text-xs bg-bg-primary border border-bg-tertiary rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                          >
                            <option value={WorkspaceRole.EDITOR}>Editor</option>
                            <option value={WorkspaceRole.VIEWER}>Viewer</option>
                          </select>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {invites.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">No pending invites</p>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-bg-tertiary"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {invite.email}
                        </span>
                        <Badge variant={roleBadgeVariant(invite.role)}>
                          {invite.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted">
                        Invited by {invite.invitedBy.name}
                        {invite.expiresAt &&
                          ` · Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="ml-3"
                    >
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-bg-tertiary">
          <Button onClick={onClose} variant="secondary" size="md">
            Close
          </Button>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} />
    </div>
  );
}
