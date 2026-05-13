'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useWorkspaceQuery, useInviteToWorkspaceMutation } from '@/hooks/queries/useWorkspaces';
import { useCollectionsQuery, useCreateCollectionMutation } from '@/hooks/queries/useCollections';
import { setActiveWorkspace } from '@/store/slices/workspace.slice';
import { WorkspaceRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateCollectionModal } from '@/components/collections/CreateCollectionModal';
import { InviteWorkspaceModal } from '@/components/workspace/InviteWorkspaceModal';
import { WorkspaceMembersModal } from '@/components/workspace/WorkspaceMembersModal';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const id = params.id as string;

  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspaceQuery(id);
  const { data: collections = [], isLoading: isCollectionsLoading } = useCollectionsQuery(id);
  const createCollectionMutation = useCreateCollectionMutation();
  const inviteMutation = useInviteToWorkspaceMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  useEffect(() => {
    dispatch(setActiveWorkspace(id));
  }, [id, dispatch]);

  const isLoading = isWorkspaceLoading || isCollectionsLoading;

  if (isLoading) {
    return <SkeletonGroup type="full-page" count={3} />;
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-muted">Workspace not found</p>
      </div>
    );
  }

  const handleCreateCollection = async (name: string) => {
    try {
      await createCollectionMutation.mutateAsync({ workspaceId: id, name });
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  };

  const handleInvite = async (email: string, role: WorkspaceRole) => {
    try {
      const result = await inviteMutation.mutateAsync({ workspaceId: id, email, role });
      return result || null;
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  };

  const canEdit = !workspace?.role || workspace?.role === 'OWNER' || workspace?.role === 'EDITOR';
  const canInvite = !workspace?.role || workspace?.role === 'OWNER';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">{workspace.name}</h1>
        <p className="text-text-muted">
          Created on {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Collections</h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsMembersOpen(true)}>
              Members
            </Button>
            {canInvite && (
              <Button variant="secondary" size="md" onClick={() => setIsInviteOpen(true)}>
                Invite
              </Button>
            )}
            {canEdit && (
              <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
                Create Collection
              </Button>
            )}
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="bg-bg-secondary/80 border border-bg-tertiary/60 rounded-xl">
            <EmptyState
              icon="📂"
              title="No Collections Yet"
              description="Create your first collection to organize your API requests"
              action={
                canEdit
                  ? {
                      label: 'Create Collection',
                      onClick: () => {
                        setIsCreateOpen(true);
                      },
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/workspace/${id}/collection/${collection.id}`}
                className="block bg-bg-secondary/80 border border-bg-tertiary/60 rounded-xl p-6 hover:border-accent/60 hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all"
              >
                <h3 className="text-lg font-semibold mb-2">{collection.name}</h3>
                <p className="text-text-muted text-sm">
                  Created {new Date(collection.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateCollectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={handleCreateCollection}
        isLoading={createCollectionMutation.isPending}
      />
      <InviteWorkspaceModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onConfirm={handleInvite}
        isLoading={inviteMutation.isPending}
      />
      <WorkspaceMembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        workspaceId={id}
        currentUserRole={workspace.role || WorkspaceRole.OWNER}
        currentUserId={user?.id || ''}
        onLeave={() => router.push('/workspace')}
      />
    </div>
  );
}
