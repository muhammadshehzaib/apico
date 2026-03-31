'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { workspaceService } from '@/services/workspace.service';
import { setActiveWorkspace } from '@/store/slices/workspace.slice';
import { Workspace, Collection, WorkspaceRole } from '@/types';
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
  const dispatch = useDispatch();
  const { user } = useAuth();
  const id = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  useEffect(() => {
    dispatch(setActiveWorkspace(id));
  }, [id, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workspaceData, collectionsData] = await Promise.all([
          workspaceService.getWorkspace(id),
          workspaceService.getCollections(id),
        ]);
        setWorkspace(workspaceData);
        setCollections(collectionsData);
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    setIsCreating(true);
    try {
      const created = await workspaceService.createCollection(id, name);
      if (!created) {
        throw new Error('Failed to create collection');
      }
      setCollections((prev) => [created, ...prev]);
    } catch (error) {
      console.error('Failed to create collection:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (email: string, role: WorkspaceRole) => {
    setIsInviting(true);
    try {
      const result = await workspaceService.inviteToWorkspace(id, email, role);
      return result || null;
    } catch (error) {
      console.error('Failed to invite user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const canEdit = !workspace?.role || workspace?.role === 'OWNER' || workspace?.role === 'EDITOR';
  const canInvite = !workspace?.role || workspace?.role === 'OWNER';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{workspace.name}</h1>
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
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg">
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
                className="block bg-bg-secondary border border-bg-tertiary rounded-lg p-6 hover:border-accent transition-colors"
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
        isLoading={isCreating}
      />
      <InviteWorkspaceModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onConfirm={handleInvite}
        isLoading={isInviting}
      />
      <WorkspaceMembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        workspaceId={id}
        currentUserRole={workspace.role || WorkspaceRole.OWNER}
        currentUserId={user?.id || ''}
      />
    </div>
  );
}
