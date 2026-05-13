'use client';

import { useState } from 'react';
import { useWorkspacesQuery, useCreateWorkspaceMutation } from '@/hooks/queries/useWorkspaces';
import { Workspace } from '@/types';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { PendingInvitesBanner } from '@/components/workspace/PendingInvitesBanner';
import Link from 'next/link';

export default function WorkspacesPage() {
  const { data: workspaces = [], isLoading, refetch } = useWorkspacesQuery();
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) {
    return <SkeletonGroup type="full-page" count={3} />;
  }

  const handleCreateWorkspace = async (name: string) => {
    try {
      await createWorkspaceMutation.mutateAsync(name);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Workspaces</h1>
          <p className="text-text-muted text-sm mt-1">
            Collaborate with unlimited members, no time limits. Free forever.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
          Create Workspace
        </Button>
      </div>

      <PendingInvitesBanner
        onInviteAccepted={async () => {
          await refetch();
        }}
      />

      {workspaces.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No Workspaces Yet"
          description="Create your first workspace to organize your API requests"
          action={{
            label: 'Create Workspace',
            onClick: () => {
              setIsCreateOpen(true);
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.id}`}
              className="block bg-bg-secondary/80 border border-bg-tertiary/60 rounded-xl p-6 hover:border-accent/60 hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all"
            >
              <h2 className="text-xl font-semibold mb-2">{workspace.name}</h2>
              <div className="flex items-center gap-3 text-text-muted text-sm">
                <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                {workspace.memberCount !== undefined && (
                  <span>
                    {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={handleCreateWorkspace}
        isLoading={createWorkspaceMutation.isPending}
      />
    </div>
  );
}
