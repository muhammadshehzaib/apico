'use client';

import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
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
import { ClearWorkspaceModal } from './ClearWorkspaceModal';
import { OpenAPIImportModal } from './OpenAPIImportModal';
import { PostmanImportModal } from './PostmanImportModal';
import { CollectionRunnerModal } from './CollectionRunnerModal';
import { RenameModal } from './RenameModal';
import { RequestItem } from './RequestItem';
import { useEnvironment } from '@/hooks/useEnvironment';
import type { ParsedEndpoint } from '@/utils/openapi.parser';
import type { ParsedPostmanRequest } from '@/utils/postman.parser';
import { reorderSidebarItems, type DropPosition } from '@/utils/sidebar-order';

type SidebarDragItem = { type: 'collection' | 'folder'; id: string };
type SidebarDropTarget = SidebarDragItem & { position: DropPosition };

interface CollectionsSidebarProps {
  workspaceId: string | null;
  isWorkspaceLoading?: boolean;
  onLoadRequest: (request: SavedRequest) => void;
  currentRequest: { method: string; url: string };
  onSaveRequest: () => void;
  pinnedRequestIds?: Set<string>;
  onTogglePinRequest?: (request: SavedRequest) => void;
}

export function CollectionsSidebar({
  workspaceId,
  isWorkspaceLoading = false,
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
    saveRequest,
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
  const [clearModalOpen, setClearModalOpen] = useState(false);
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
  const [openApiModalOpen, setOpenApiModalOpen] = useState(false);
  const [postmanModalOpen, setPostmanModalOpen] = useState(false);
  const [runnerTarget, setRunnerTarget] = useState<CollectionWithRequests | null>(null);
  const [dragItem, setDragItem] = useState<SidebarDragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<SidebarDropTarget | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeEnvironment } = useEnvironment(workspaceId);
  const activeVariables = activeEnvironment?.variables ?? [];

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

  const clearDrag = () => {
    setDragItem(null);
    setDropTarget(null);
  };

  const startDrag = (item: SidebarDragItem) => (e: DragEvent) => {
    e.stopPropagation();
    setDragItem(item);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const getDropPosition = (e: DragEvent, type: SidebarDragItem['type']): DropPosition => {
    if (type === 'folder' && dragItem?.type === 'collection') return 'inside';
    const bounds = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - bounds.top) / bounds.height;
    if (type === 'folder' && ratio >= 0.25 && ratio <= 0.75) return 'inside';
    return ratio < 0.5 ? 'before' : 'after';
  };

  const handleRowDragOver = (target: SidebarDragItem) => (e: DragEvent) => {
    e.stopPropagation();
    if (!dragItem || isMoving || dragItem.id === target.id ||
      (target.type === 'collection' && dragItem.type !== 'collection')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ ...target, position: getDropPosition(e, target.type) });
  };

  const moveDraggedItem = async (
    item: SidebarDragItem,
    destinationId: string | null,
    targetId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    setIsMoving(true);
    try {
      if (item.type === 'collection') {
        const dragged = collections.find((c) => c.id === item.id);
        if (!dragged) return;
        const items = reorderSidebarItems(collectionsByFolder.get(destinationId) || [], dragged, targetId, position);
        await reorderCollections(items.map(({ id, order }) => ({ id, order, folderId: destinationId })));
      } else {
        const dragged = folders.find((f) => f.id === item.id);
        if (!dragged) return;
        // A folder cannot be dropped into itself or any of its descendants.
        let ancestorId = destinationId;
        const visited = new Set<string>();
        while (ancestorId) {
          if (ancestorId === dragged.id || visited.has(ancestorId)) {
            showToast('Cannot move a folder into itself or its descendants', 'error');
            return;
          }
          visited.add(ancestorId);
          ancestorId = folders.find((f) => f.id === ancestorId)?.parentId ?? null;
        }
        const items = reorderSidebarItems(foldersByParent.get(destinationId) || [], dragged, targetId, position);
        await reorderFolders(items.map(({ id, order }) => ({ id, order, parentId: destinationId })));
      }
      if (destinationId) setExpandedFolderIds((prev) => new Set([...prev, destinationId]));
    } catch {
      showToast('Failed to move item. Please try again.', 'error');
    } finally {
      setIsMoving(false);
    }
  };

  const readDropItem = (e: DragEvent): SidebarDragItem | null => {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      return data && (data.type === 'collection' || data.type === 'folder') && typeof data.id === 'string'
        ? data : null;
    } catch {
      return null;
    }
  };

  const handleCollectionDrop = (target: CollectionWithRequests) => async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = readDropItem(e);
    const position = getDropPosition(e, 'collection') as 'before' | 'after';
    clearDrag();
    if (!item || isMoving || item.type !== 'collection' || item.id === target.id) return;
    await moveDraggedItem(item, target.folderId ?? null, target.id, position);
  };

  const handleFolderDrop = (target: Folder) => async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = readDropItem(e);
    const position = getDropPosition(e, 'folder');
    clearDrag();
    if (!item || isMoving || item.id === target.id) return;
    if (position === 'inside' || item.type === 'collection') {
      await moveDraggedItem(item, target.id);
    } else {
      await moveDraggedItem(item, target.parentId ?? null, target.id, position);
    }
  };

  const handleRootDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = readDropItem(e);
    clearDrag();
    if (item && !isMoving) await moveDraggedItem(item, null);
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

  const handlePostmanImport = async (collectionName: string, requests: ParsedPostmanRequest[]) => {
    if (!workspaceId) {
      showToast('No active workspace', 'error');
      return;
    }
    const collection = await createCollection(collectionName);
    if (!collection) {
      throw new Error('Failed to create collection');
    }
    let succeeded = 0;
    let failed = 0;
    for (const req of requests) {
      try {
        await saveRequest(collection.id, {
          name: req.name,
          method: req.method,
          url: req.url,
          headers: req.headers,
          params: req.params,
          body: req.body,
          auth: req.auth,
          preRequestScript: req.preRequestScript,
          postResponseScript: req.postResponseScript,
        });
        succeeded++;
      } catch {
        failed++;
      }
    }
    if (failed === 0) {
      showToast(`Imported ${succeeded} requests`, 'success');
    } else {
      showToast(`Imported ${succeeded}, failed ${failed}`, failed > succeeded ? 'error' : 'success');
    }
  };

  const handleOpenAPIImport = async (collectionName: string, endpoints: ParsedEndpoint[]) => {
    if (!workspaceId) {
      showToast('No active workspace', 'error');
      return;
    }
    const collection = await createCollection(collectionName);
    if (!collection) {
      throw new Error('Failed to create collection');
    }
    let succeeded = 0;
    let failed = 0;
    for (const ep of endpoints) {
      try {
        await saveRequest(collection.id, {
          name: ep.name,
          method: ep.method,
          url: ep.url,
          headers: ep.headers,
          params: ep.params,
          body: ep.body,
          auth: ep.auth,
        });
        succeeded++;
      } catch {
        failed++;
      }
    }
    if (failed === 0) {
      showToast(`Imported ${succeeded} requests`, 'success');
    } else {
      showToast(`Imported ${succeeded}, failed ${failed}`, failed > succeeded ? 'error' : 'success');
    }
  };

  const handleImportFile = async (file: File) => {
    if (!workspaceId) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await workspaceService.importApico(workspaceId, payload);
      await fetchCollections();
      await fetchFolders();
      await fetchTags();
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

    setIsClearing(true);
    try {
      const result = await workspaceService.clearWorkspaceData(workspaceId);
      await fetchCollections();
      await fetchFolders();
      await fetchTags();
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

  const handleClearConfirm = async () => {
    await handleClearAll();
    setClearModalOpen(false);
  };


  if (isWorkspaceLoading) {
    return <div className="p-4" role="status" aria-label="Loading workspace"><SkeletonGroup type="collection-item" count={2} /></div>;
  }

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
        onRun={async () => {
          try {
            const requests = await fetchRequests(collection.id);
            setRunnerTarget({ ...collection, requests });
          } catch {
            showToast('Failed to load requests', 'error');
          }
        }}
        onRetryRequests={() => {
          void fetchRequests(collection.id).catch(() => showToast('Failed to load requests', 'error'));
        }}
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
        onDragStart={isMoving ? undefined : startDrag({ type: 'collection', id: collection.id })}
        onDragEnd={clearDrag}
        isDragging={dragItem?.id === collection.id}
        dropPosition={dropTarget?.type === 'collection' && dropTarget.id === collection.id ? dropTarget.position : undefined}
        onDragOver={handleRowDragOver({ type: 'collection', id: collection.id })}
        onDrop={handleCollectionDrop(collection)}
      />
    ))
  );

  const renderFolder = (folder: Folder, depth = 0) => {
    const childFolders = foldersByParent.get(folder.id) || [];
    const childCollections = collectionsByFolder.get(folder.id) || [];
    const isExpanded = expandedFolderIds.has(folder.id);
    const position = dropTarget?.type === 'folder' && dropTarget.id === folder.id ? dropTarget.position : undefined;

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`relative flex items-center gap-2 min-h-9 rounded-md hover:bg-bg-tertiary/60 transition-colors group border px-1 ${position === 'inside' ? 'border-accent bg-accent/10' : 'border-transparent hover:border-stroke/60'} ${dragItem?.id === folder.id ? 'opacity-40' : ''}`}
          draggable={!isMoving}
          onDragStart={startDrag({ type: 'folder', id: folder.id })}
          onDragEnd={clearDrag}
          onDragOver={handleRowDragOver({ type: 'folder', id: folder.id })}
          onDrop={handleFolderDrop(folder)}
        >
          {position && position !== 'inside' && (
            <span className={`pointer-events-none absolute left-0 right-0 h-0.5 bg-accent ${position === 'before' ? 'top-0' : 'bottom-0'}`} />
          )}
          <span title="Drag to reorder or move folder" aria-label="Drag to reorder or move folder" className="cursor-grab active:cursor-grabbing text-text-muted select-none">&#x283F;</span>
          <button
            onClick={() => toggleFolder(folder.id)}
            className="px-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="text-sm text-text-muted flex-shrink-0">🗂</span>
          <button
            onClick={() => toggleFolder(folder.id)}
            className="min-w-0 flex-1 py-1 text-left text-sm font-medium text-text-primary hover:text-text-primary transition-colors line-clamp-2 break-words [overflow-wrap:anywhere]"
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
    <div className="min-w-0 p-4 space-y-4" onDragEnd={clearDrag}>
      <Toast {...toastProps} />
      <div className="space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.2em]">
            Collections
          </h3>
          <div className="flex shrink-0 items-center gap-2">
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
        <div className="grid grid-cols-4 gap-1" aria-label="Collection imports and cleanup">
          <button
            onClick={handleImportClick}
            className="text-text-muted hover:text-text-primary text-[10px] transition-colors border border-stroke rounded-md px-1 py-1.5"
            title="Import Apico JSON"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={() => setOpenApiModalOpen(true)}
            className="text-text-muted hover:text-text-primary text-[10px] transition-colors border border-stroke rounded-md px-1 py-1.5"
            title="Import from OpenAPI / Swagger spec"
          >
            OpenAPI
          </button>
          <button
            onClick={() => setPostmanModalOpen(true)}
            className="text-text-muted hover:text-text-primary text-[10px] transition-colors border border-stroke rounded-md px-1 py-1.5"
            title="Import from Postman collection (v2.0/v2.1)"
          >
            Postman
          </button>
          <button
            onClick={() => setClearModalOpen(true)}
            className="text-danger hover:text-danger/80 text-[10px] transition-colors border border-danger/40 rounded-md px-1 py-1.5"
            title="Delete all collections, requests, folders, and tags"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear'}
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
            {dragItem && (
              <div
                className="rounded-md border border-dashed border-accent/50 px-3 py-3 text-xs text-text-muted hover:bg-accent/10"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setDropTarget(null);
                }}
                onDrop={handleRootDrop}
              >
                Drop here to move to top level
              </div>
            )}
            {isMoving && <p role="status" className="text-xs text-text-muted">Saving order...</p>}
          </>
        )}
      </div>

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateCollection}
        isLoading={isCreating}
      />

      <OpenAPIImportModal
        isOpen={openApiModalOpen}
        onClose={() => setOpenApiModalOpen(false)}
        onImport={handleOpenAPIImport}
      />

      <PostmanImportModal
        isOpen={postmanModalOpen}
        onClose={() => setPostmanModalOpen(false)}
        onImport={handlePostmanImport}
      />

      {runnerTarget && (
        <CollectionRunnerModal
          isOpen={!!runnerTarget}
          onClose={() => setRunnerTarget(null)}
          collectionName={runnerTarget.name}
          requests={runnerTarget.requests}
          environmentVars={activeVariables}
        />
      )}

      <CreateFolderModal
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onConfirm={handleCreateFolder}
        isLoading={isCreatingFolder}
      />

      <ClearWorkspaceModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearConfirm}
        isLoading={isClearing}
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
