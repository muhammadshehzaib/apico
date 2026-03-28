'use client';

import { useState, useEffect } from 'react';
import { SavedRequest } from '@/types';
import { useCollections } from '@/hooks/useCollections';
import { useToast } from '@/hooks/useToast';
import { CollectionItem } from './CollectionItem';
import { CreateCollectionModal } from './CreateCollectionModal';
import { RenameModal } from './RenameModal';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';

interface CollectionsSidebarProps {
  workspaceId: string | null;
  onLoadRequest: (request: SavedRequest) => void;
  currentRequest: { method: string; url: string };
  onSaveRequest: () => void;
}

export function CollectionsSidebar({
  workspaceId,
  onLoadRequest,
  currentRequest,
  onSaveRequest,
}: CollectionsSidebarProps) {
  const {
    collections,
    isLoading,
    expandedIds,
    toggleExpand,
    createCollection,
    renameCollection,
    deleteCollection,
    renameRequest,
    deleteRequest,
  } = useCollections(workspaceId);

  const { showToast, ...toastProps } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: 'collection' | 'request';
    id: string;
    collectionId?: string;
    currentName: string;
  } | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleCreateCollection = async (name: string) => {
    setIsCreating(true);
    try {
      await createCollection(name);
      showToast('Collection created!', 'success');
    } catch {
      showToast('Failed to create collection', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameCollection = (collectionId: string, currentName: string) => {
    setRenameTarget({
      type: 'collection',
      id: collectionId,
      currentName,
    });
    setRenameModalOpen(true);
  };

  const handleRenameRequest = (request: SavedRequest, collectionId: string) => {
    setRenameTarget({
      type: 'request',
      id: request.id,
      collectionId,
      currentName: request.name,
    });
    setRenameModalOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renameTarget) return;

    setIsRenaming(true);
    try {
      if (renameTarget.type === 'collection') {
        await renameCollection(renameTarget.id, newName);
        showToast('Collection renamed', 'success');
      } else {
        await renameRequest(renameTarget.id, renameTarget.collectionId!, newName);
        showToast('Request renamed', 'success');
      }
    } catch {
      showToast('Failed to rename', 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await deleteCollection(collectionId);
      showToast('Collection deleted', 'success');
    } catch {
      showToast('Failed to delete collection', 'error');
    }
  };

  const handleDeleteRequest = async (request: SavedRequest, collectionId: string) => {
    try {
      await deleteRequest(request.id, collectionId);
      showToast('Request deleted', 'success');
    } catch {
      showToast('Failed to delete request', 'error');
    }
  };


  if (!workspaceId) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-muted text-sm">Open a workspace to see collections</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Collections
        </h3>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="text-accent hover:text-blue-400 font-bold text-lg transition-colors"
          title="Create collection"
        >
          +
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <SkeletonGroup type="collection-item" count={2} />
        ) : collections.length === 0 ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-text-muted text-sm">No collections yet</p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Create Collection
            </Button>
          </div>
        ) : (
          collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              isExpanded={expandedIds.has(collection.id)}
              onToggle={() => toggleExpand(collection.id)}
              onRename={() => handleRenameCollection(collection.id, collection.name)}
              onDelete={() => handleDeleteCollection(collection.id)}
              onLoadRequest={onLoadRequest}
              onRenameRequest={(request) => handleRenameRequest(request, collection.id)}
              onDeleteRequest={(request) => handleDeleteRequest(request, collection.id)}
            />
          ))
        )}
      </div>

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateCollection}
        isLoading={isCreating}
      />

      <RenameModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onConfirm={handleConfirmRename}
        currentName={renameTarget?.currentName || ''}
        title={
          renameTarget?.type === 'collection'
            ? 'Rename Collection'
            : 'Rename Request'
        }
        isLoading={isRenaming}
      />
    </div>
  );
}
