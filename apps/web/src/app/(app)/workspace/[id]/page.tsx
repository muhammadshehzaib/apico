'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { workspaceService } from '@/services/workspace.service';
import { setActiveWorkspace } from '@/store/slices/workspace.slice';
import { Workspace, Collection } from '@/types';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const id = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <Button variant="primary" size="md">
            Create Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg">
            <EmptyState
              icon="📂"
              title="No Collections Yet"
              description="Create your first collection to organize your API requests"
              action={{
                label: 'Create Collection',
                onClick: () => {
                  // Handle create collection
                },
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/app/workspace/${id}/collection/${collection.id}`}
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
    </div>
  );
}
