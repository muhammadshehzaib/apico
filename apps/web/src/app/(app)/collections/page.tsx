'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useCollections } from '@/hooks/useCollections';
import { CollectionItem } from '@/components/collections/CollectionItem';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function CollectionsPage() {
  const router = useRouter();
  const activeWorkspaceId = useSelector(
    (state: RootState) => state.workspace.activeWorkspaceId
  );

  const {
    collections,
    isLoading,
    expandedIds,
    toggleExpand,
    renameCollection,
    deleteCollection,
    renameRequest,
    deleteRequest,
  } = useCollections(activeWorkspaceId);

  const handleLoadRequest = (request: any) => {
    router.push('/request');
    // In a real app, you might want to load this request into state before navigating
    // or pass it via URL params.
  };

  if (!activeWorkspaceId) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Collections</h1>
        <EmptyState
          icon="📂"
          title="No Workspace Selected"
          description="Please select or create a workspace to view its collections."
          action={{
            label: 'Go to Workspaces',
            onClick: () => router.push('/workspace'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-heading">Collections</h1>
        <Button 
          variant="primary" 
          size="md"
          onClick={() => {
            // This would ideally open the CreateCollectionModal
            // but for now we'll just show the button
          }}
        >
          New Collection
        </Button>
      </div>

      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden shadow-glass">
        {isLoading ? (
          <div className="p-6">
            <SkeletonGroup type="collection-item" count={5} />
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No Collections Found"
            description="Organize your requests by creating your first collection."
            action={{
              label: 'Create Collection',
              onClick: () => {
                // Handle create
              },
            }}
          />
        ) : (
          <div className="divide-y divide-bg-tertiary">
            {collections.map((collection) => (
              <div key={collection.id} className="p-4 hover:bg-bg-tertiary/50 transition-colors">
                <CollectionItem
                  collection={collection}
                  isExpanded={expandedIds.has(collection.id)}
                  onToggle={() => toggleExpand(collection.id)}
                  onRename={() => renameCollection(collection.id, 'New Name')} // Placeholder
                  onDelete={() => deleteCollection(collection.id)}
                  onLoadRequest={handleLoadRequest}
                  onRenameRequest={(req) => renameRequest(req.id, collection.id, 'New Name')} // Placeholder
                  onDeleteRequest={(req) => deleteRequest(req.id, collection.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
