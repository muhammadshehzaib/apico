'use client';

import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import type { CollectionWithRequests } from '@/hooks/useCollections';
import { useCollections } from '@/hooks/useCollections';
import { useToast } from '@/hooks/useToast';
import { workspaceService } from '@/services/workspace.service';
import { Folder, SavedRequest } from '@/types';
import type { DragEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CollectionItem } from './CollectionItem';
import { CreateCollectionModal } from './CreateCollectionModal';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameModal } from './RenameModal';
import { RequestItem } from './RequestItem';

interface CollectionsSidebarProps {
  workspaceId: string | null;
  onLoadRequest: (request: SavedRequest) => void;
  currentRequest: { method: string; url: string };
  onSaveRequest: () => void;
  pinnedRequestIds?: Set<string>;
  onTogglePinRequest?: (request: SavedRequest) => void;
}

export function CollectionsSidebar({
  workspaceId,
  onLoadRequest,
  currentRequest,
  onSaveRequest,
  pinnedRequestIds,
  onTogglePinRequest,
}: CollectionsSidebarProps) {
  const {
    collections,
    isLoading,
    isFoldersLoading,
    isTagsLoading,
    expandedIds,
    folders,
    tags,
    fetchCollections,
    fetchFolders,
    fetchTags,
    fetchRequests,
    toggleExpand,
    createCollection,
    renameCollection,
    deleteCollection,
    moveCollection,
    reorderCollections,
    renameRequest,
    deleteRequest,
    moveRequest,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    reorderFolders,
    updateRequestTags,
    searchRequests,
    reorderRequests,
    shareCollection,
    shareRequest,
  } = useCollections(workspaceId);

  const { showToast, ...toastProps } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: 'collection' | 'request' | 'folder';
    id: string;
    collectionId?: string;
    currentName: string;
  } | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [bulkMoveTarget, setBulkMoveTarget] = useState<string>('root');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SavedRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreateFolder = async (name: string) => {
    setIsCreatingFolder(true);
    try {
      await createFolder(name);
      showToast('Folder created!', 'success');
    } catch {
      showToast('Failed to create folder', 'error');
    } finally {
      setIsCreatingFolder(false);
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

  const handleRenameFolder = (folderId: string, currentName: string) => {
    setRenameTarget({
      type: 'folder',
      id: folderId,
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
      } else if (renameTarget.type === 'folder') {
        await renameFolder(renameTarget.id, newName);
        showToast('Folder renamed', 'success');
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

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      showToast('Folder deleted', 'success');
    } catch {
      showToast('Failed to delete folder', 'error');
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

  useEffect(() => {
    if (!workspaceId) return;
    const hasFilters = searchQuery.trim().length > 0 || activeTags.length > 0;
    if (!hasFilters) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchRequests({
          q: searchQuery.trim(),
          tags: activeTags,
        });
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [workspaceId, searchQuery, activeTags, searchRequests]);

  const collectionsByFolder = useMemo(() => {
    const map = new Map<string | null, typeof collections>();
    for (const collection of collections) {
      const key = collection.folderId ?? null;
      const list = map.get(key) || [];
      list.push(collection);
      map.set(key, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      map.set(key, list);
    }
    return map;
  }, [collections]);

  const foldersByParent = useMemo(() => {
    const map = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      const key = folder.parentId ?? null;
      const list = map.get(key) || [];
      list.push(folder);
      map.set(key, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      map.set(key, list);
    }
    return map;
  }, [folders]);

  const getMaxCollectionOrder = (folderId: string | null) => {
    const list = collectionsByFolder.get(folderId ?? null) || [];
    return list.reduce((max, c) => Math.max(max, c.order ?? 0), 0);
  };

  const getMaxFolderOrder = (parentId: string | null) => {
    const list = foldersByParent.get(parentId ?? null) || [];
    return list.reduce((max, f) => Math.max(max, f.order ?? 0), 0);
  };

  const parseDragData = (e: DragEvent) => {
    try {
      const raw = e.dataTransfer.getData('text/plain');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const handleCollectionDragStart = (collectionId: string) => (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'collection', id: collectionId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDragStart = (folderId: string) => (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folderId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCollectionDrop = (target: CollectionWithRequests) => async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = parseDragData(e);
    if (!data || data.type !== 'collection' || data.id === target.id) return;

    const dragged = collections.find((c) => c.id === data.id);
    if (!dragged) return;

    if ((dragged.folderId ?? null) !== (target.folderId ?? null)) {
      const newOrder = getMaxCollectionOrder(target.folderId ?? null) + 1;
      await reorderCollections([
        { id: dragged.id, order: newOrder, folderId: target.folderId ?? null },
      ]);
      return;
    }

    await reorderCollections([
      { id: dragged.id, order: target.order ?? 0, folderId: target.folderId ?? null },
      { id: target.id, order: dragged.order ?? 0, folderId: target.folderId ?? null },
    ]);
  };

  const handleFolderDrop = (target: Folder) => async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = parseDragData(e);
    if (!data) return;

    if (data.type === 'collection') {
      const dragged = collections.find((c) => c.id === data.id);
      if (!dragged) return;
      const newOrder = getMaxCollectionOrder(target.id) + 1;
      await reorderCollections([{ id: dragged.id, order: newOrder, folderId: target.id }]);
      return;
    }

    if (data.type === 'folder') {
      if (data.id === target.id) return;
      const dragged = folders.find((f) => f.id === data.id);
      if (!dragged) return;

      if ((dragged.parentId ?? null) === (target.parentId ?? null)) {
        await reorderFolders([
          { id: dragged.id, order: target.order ?? 0, parentId: dragged.parentId ?? null },
          { id: target.id, order: dragged.order ?? 0, parentId: target.parentId ?? null },
        ]);
        return;
      }

      const newOrder = getMaxFolderOrder(target.id) + 1;
      await reorderFolders([{ id: dragged.id, order: newOrder, parentId: target.id }]);
    }
  };

  const handleRootDrop = async (e: DragEvent) => {
    e.preventDefault();
    const data = parseDragData(e);
    if (!data) return;

    if (data.type === 'collection') {
      const dragged = collections.find((c) => c.id === data.id);
      if (!dragged) return;
      const newOrder = getMaxCollectionOrder(null) + 1;
      await reorderCollections([{ id: dragged.id, order: newOrder, folderId: null }]);
    }

    if (data.type === 'folder') {
      const dragged = folders.find((f) => f.id === data.id);
      if (!dragged) return;
      const newOrder = getMaxFolderOrder(null) + 1;
      await reorderFolders([{ id: dragged.id, order: newOrder, parentId: null }]);
    }
  };

  const handleTagRequest = async (request: SavedRequest) => {
    const current = request.tags?.map((tag) => tag.name).join(', ') || '';
    const input = window.prompt('Enter tags (comma-separated)', current);
    if (input === null) return;
    const tagsList = input
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    try {
      await updateRequestTags(request.id, tagsList);
      showToast('Tags updated', 'success');
    } catch {
      showToast('Failed to update tags', 'error');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleCollectionSelect = (id: string, selected: boolean) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleRequestSelect = (id: string, selected: boolean) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCollections(new Set());
    setSelectedRequests(new Set());
  };

  useEffect(() => {
    if (!bulkMode) {
      clearSelection();
    }
  }, [bulkMode]);

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedRequests) {
        const request = collections.flatMap((c) => c.requests).find((r) => r.id === id);
        if (request) {
          await deleteRequest(request.id, request.collectionId);
        }
      }
      for (const id of selectedCollections) {
        await deleteCollection(id);
      }
      showToast('Selected items deleted', 'success');
      clearSelection();
    } catch {
      showToast('Failed to delete selected items', 'error');
    }
  };

  const handleBulkShare = async () => {
    try {
      const links: string[] = [];
      for (const id of selectedCollections) {
        const link = await shareCollection(id);
        links.push(`${window.location.origin}/share/collection/${link.token}`);
      }
      for (const id of selectedRequests) {
        const link = await shareRequest(id);
        links.push(`${window.location.origin}/share/request/${link.token}`);
      }
      if (links.length > 0) {
        await navigator.clipboard.writeText(links.join('\n'));
        showToast('Share links copied to clipboard', 'success');
      } else {
        showToast('No items selected', 'error');
      }
    } catch {
      showToast('Failed to share selected items', 'error');
    }
  };

  const handleBulkMove = async () => {
    if (selectedCollections.size > 0 && selectedRequests.size > 0) {
      showToast('Select collections or requests, not both', 'error');
      return;
    }

    if (selectedCollections.size > 0) {
      const targetFolderId = bulkMoveTarget === 'root' ? null : bulkMoveTarget;
      try {
        for (const id of selectedCollections) {
          await moveCollection(id, targetFolderId);
        }
        showToast('Collections moved', 'success');
        clearSelection();
      } catch {
        showToast('Failed to move collections', 'error');
      }
      return;
    }

    if (selectedRequests.size > 0) {
      const targetCollectionId = bulkMoveTarget;
      if (!targetCollectionId || targetCollectionId === 'root') {
        showToast('Select a target collection', 'error');
        return;
      }
      try {
        for (const id of selectedRequests) {
          const request = collections.flatMap((c) => c.requests).find((r) => r.id === id);
          if (request) {
            await moveRequest(request.id, request.collectionId, targetCollectionId);
          }
        }
        showToast('Requests moved', 'success');
        clearSelection();
      } catch {
        showToast('Failed to move requests', 'error');
      }
    }
  };

  const handleBulkExport = async () => {
    const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
    const exportFolders = new Map<string, Folder>();

    const addFolderWithAncestors = (folderId?: string | null) => {
      let currentId = folderId ?? null;
      while (currentId) {
        const folder = folderMap.get(currentId);
        if (!folder) break;
        exportFolders.set(folder.id, folder);
        currentId = folder.parentId ?? null;
      }
    };

    const exportCollections: CollectionWithRequests[] = [];
    const exportRequests: SavedRequest[] = [];

    const collectionIds = new Set(selectedCollections);

    for (const requestId of selectedRequests) {
      const request = collections.flatMap((c) => c.requests).find((r) => r.id === requestId);
      if (request) {
        exportRequests.push(request);
        collectionIds.add(request.collectionId);
      }
    }

    for (const id of collectionIds) {
      const collection = collections.find((c) => c.id === id);
      if (!collection) continue;
      exportCollections.push(collection);
      addFolderWithAncestors(collection.folderId ?? null);

      const requests =
        collection.requests.length > 0 ? collection.requests : await fetchRequests(collection.id);
      for (const request of requests) {
        exportRequests.push(request);
      }
    }

    const uniqueRequests = new Map(exportRequests.map((request) => [request.id, request]));
    const uniqueCollections = new Map(exportCollections.map((col) => [col.id, col]));

    const exportTagsMap = new Map<string, { id: string; name: string }>();
    for (const request of uniqueRequests.values()) {
      for (const tag of request.tags || []) {
        exportTagsMap.set(tag.id, { id: tag.id, name: tag.name });
      }
    }

    const exportData: any = {
      format: 'apico',
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: Array.from(exportFolders.values()),
      collections: Array.from(uniqueCollections.values()),
      requests: Array.from(uniqueRequests.values()),
      tags: Array.from(exportTagsMap.values()),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apico-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Export downloaded', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    if (!workspaceId) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await workspaceService.importApico(workspaceId, payload);
      await fetchCollections(workspaceId);
      await fetchFolders(workspaceId);
      await fetchTags(workspaceId);
      showToast('Import completed', 'success');
    } catch (err) {
      showToast('Failed to import file', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearAll = async () => {
    if (!workspaceId) return;

    const confirmed = window.confirm(
      'This will delete all collections, requests, folders, and tags in this workspace. This cannot be undone. Continue?'
    );
    if (!confirmed) return;

    setIsClearing(true);
    try {
      const result = await workspaceService.clearWorkspaceData(workspaceId);
      await fetchCollections(workspaceId);
      await fetchFolders(workspaceId);
      await fetchTags(workspaceId);
      if (result) {
        showToast(
          `Cleared ${result.collectionsDeleted} collections, ${result.foldersDeleted} folders, ${result.tagsDeleted} tags`,
          'success'
        );
      } else {
        showToast('Workspace data cleared', 'success');
      }
    } catch (err) {
      showToast('Failed to clear workspace data', 'error');
    } finally {
      setIsClearing(false);
    }
  };


  if (!workspaceId) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-muted text-sm">Open a workspace to see collections</p>
      </div>
    );
  }

  const showSearchResults = searchQuery.trim().length > 0 || activeTags.length > 0;
  const selectedCount = selectedCollections.size + selectedRequests.size;

  const renderCollections = (list: CollectionWithRequests[]) => (
    list.map((collection) => (
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
        onTagRequest={handleTagRequest}
        isRequestPinned={(id) => !!pinnedRequestIds?.has(id)}
        onToggleRequestPin={onTogglePinRequest}
        showRequestSelect={bulkMode}
        isRequestSelected={(id) => selectedRequests.has(id)}
        onSelectRequest={toggleRequestSelect}
        showSelect={bulkMode}
        isSelected={selectedCollections.has(collection.id)}
        onSelect={(selected) => toggleCollectionSelect(collection.id, selected)}
        onDragStart={handleCollectionDragStart(collection.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCollectionDrop(collection)}
      />
    ))
  );

  const renderFolder = (folder: Folder, depth = 0) => {
    const childFolders = foldersByParent.get(folder.id) || [];
    const childCollections = collectionsByFolder.get(folder.id) || [];
    const isExpanded = expandedFolderIds.has(folder.id);

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className="flex items-center gap-2 h-9 rounded-md hover:bg-bg-tertiary/60 transition-colors group border border-transparent hover:border-stroke/60 px-1"
          draggable
          onDragStart={handleFolderDragStart(folder.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFolderDrop(folder)}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="px-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="text-sm text-text-muted flex-shrink-0">🗂</span>
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex-1 text-left text-sm font-medium text-text-primary hover:text-text-primary transition-colors"
          >
            {folder.name}
          </button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRenameFolder(folder.id, folder.name);
              }}
              className="text-text-muted hover:text-text-primary text-xs"
              title="Rename folder"
            >
              ✎
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
              className="text-danger hover:text-danger/80 text-xs"
              title="Delete folder"
            >
              🗑
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="pl-4 border-l border-bg-tertiary/60 space-y-1">
            {childFolders.map((child) => renderFolder(child, depth + 1))}
            {renderCollections(childCollections)}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-2">
      {isSearching ? (
        <SkeletonGroup type="collection-item" count={2} />
      ) : searchResults.length === 0 ? (
        <div className="text-xs text-text-muted">No matching requests</div>
      ) : (
        searchResults.map((request) => (
          <RequestItem
            key={request.id}
            request={request}
            onLoad={() => onLoadRequest(request)}
            onRename={() => handleRenameRequest(request, request.collectionId)}
            onDelete={() => handleDeleteRequest(request, request.collectionId)}
            onTags={() => handleTagRequest(request)}
            showSelect={bulkMode}
            isSelected={selectedRequests.has(request.id)}
            onSelect={(selected) => toggleRequestSelect(request.id, selected)}
          />
        ))
      )}
    </div>
  );

  const rootFolders = foldersByParent.get(null) || [];
  const rootCollections = collectionsByFolder.get(null) || [];

  return (
    <div className="p-4 space-y-4" onDragOver={(e) => e.preventDefault()} onDrop={handleRootDrop}>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.2em]">
          Collections
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportClick}
            className="text-text-muted hover:text-text-primary text-xs transition-colors border border-stroke rounded-md px-2 py-1"
            title="Import Apico JSON"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={handleClearAll}
            className="text-danger hover:text-danger/80 text-xs transition-colors border border-danger/40 rounded-md px-2 py-1"
            title="Delete all collections, requests, folders, and tags"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear'}
          </button>
          <button
            onClick={() => setCreateFolderOpen(true)}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
            title="Create folder"
          >
            +📁
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="text-accent hover:text-accentSoft font-bold text-lg transition-colors"
            title="Create collection"
          >
            +
          </button>
          <button
            onClick={() => setBulkMode((prev) => !prev)}
            className={`text-xs px-2 py-1 rounded-md border ${
              bulkMode
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-bg-tertiary/60 text-text-muted border-stroke'
            }`}
          >
            Bulk
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleImportFile(file);
          }
        }}
        className="hidden"
      />

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search requests..."
        className="w-full px-3 py-2 bg-bg-primary/80 border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 text-text-primary text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {isTagsLoading ? (
          <span className="text-xs text-text-muted">Loading tags...</span>
        ) : tags.length === 0 ? (
          <span className="text-xs text-text-muted">No tags yet</span>
        ) : (
          tags.map((tag) => {
            const active = activeTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                onClick={() =>
                  setActiveTags((prev) =>
                    prev.includes(tag.name)
                      ? prev.filter((t) => t !== tag.name)
                      : [...prev, tag.name]
                  )
                }
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-accent/20 text-accent border-accent/40'
                    : 'bg-bg-tertiary/60 text-text-muted border-stroke'
                }`}
              >
                {tag.name}
              </button>
            );
          })
        )}
      </div>

      {bulkMode && (
        <div className="bg-bg-primary/70 border border-stroke rounded-md p-3 space-y-2">
          <div className="text-xs text-text-muted">Selected: {selectedCount}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={bulkMoveTarget}
              onChange={(e) => setBulkMoveTarget(e.target.value)}
              className="text-xs px-2 py-1 bg-bg-secondary border border-stroke rounded-md text-text-primary"
            >
              {selectedCollections.size > 0 && (
                <>
                  <option value="root">Move collections to root</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      Folder: {folder.name}
                    </option>
                  ))}
                </>
              )}
              {selectedRequests.size > 0 && (
                <>
                  <option value="root">Select target collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <Button variant="secondary" size="sm" onClick={handleBulkMove}>
              Move
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkShare}>
              Share
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkExport}>
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkDelete}>
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading || isFoldersLoading ? (
          <SkeletonGroup type="collection-item" count={2} />
        ) : showSearchResults ? (
          renderResults()
        ) : collections.length === 0 && folders.length === 0 ? (
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
          <>
            {rootFolders.map((folder) => renderFolder(folder))}
            {renderCollections(rootCollections)}
          </>
        )}
      </div>

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateCollection}
        isLoading={isCreating}
      />

      <CreateFolderModal
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onConfirm={handleCreateFolder}
        isLoading={isCreatingFolder}
      />

      <RenameModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onConfirm={handleConfirmRename}
        currentName={renameTarget?.currentName || ''}
        title={
          renameTarget?.type === 'collection'
            ? 'Rename Collection'
            : renameTarget?.type === 'folder'
              ? 'Rename Folder'
              : 'Rename Request'
        }
        isLoading={isRenaming}
      />
    </div>
  );
}
