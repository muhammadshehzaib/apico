'use client';

import { useEffect, useState } from 'react';
import { workspaceService } from '@/services/workspace.service';
import { Workspace } from '@/types';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await workspaceService.getWorkspaces();
        setWorkspaces(data);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  if (isLoading) {
    return <SkeletonGroup type="full-page" count={3} />;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <Button variant="primary" size="md">
          Create Workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No Workspaces Yet"
          description="Create your first workspace to organize your API requests"
          action={{
            label: 'Create Workspace',
            onClick: () => {
              // Handle create workspace
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/app/workspace/${workspace.id}`}
              className="block bg-bg-secondary border border-bg-tertiary rounded-lg p-6 hover:border-accent transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{workspace.name}</h2>
              <p className="text-text-muted text-sm">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
