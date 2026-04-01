'use client';

import { useRef, useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import { CollectionWithRequests } from '@/hooks/useCollections';
import { SavedRequest } from '@/types';
import { RequestItem } from './RequestItem';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';

interface CollectionItemProps {
  collection: CollectionWithRequests;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onLoadRequest: (request: SavedRequest) => void;
  onRenameRequest: (request: SavedRequest) => void;
  onDeleteRequest: (request: SavedRequest) => void;
  onTagRequest?: (request: SavedRequest) => void;
  showRequestSelect?: boolean;
  isRequestSelected?: (id: string) => boolean;
  onSelectRequest?: (id: string, selected: boolean) => void;
  showSelect?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}

export function CollectionItem({
  collection,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  onLoadRequest,
  onRenameRequest,
  onDeleteRequest,
  onTagRequest,
  showRequestSelect = false,
  isRequestSelected,
  onSelectRequest,
  showSelect = false,
  isSelected = false,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
}: CollectionItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setShowMenu(false);
    setShowConfirm(false);
    onToggle();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="space-y-1" ref={menuRef}>
      <div
        className="flex items-center gap-2 h-9 rounded-md hover:bg-bg-tertiary/60 transition-colors group border border-transparent hover:border-stroke/60 px-1"
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {showSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 accent-accent cursor-pointer"
          />
        )}
        <button
          onClick={handleToggle}
          className="px-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          {isExpanded ? '▼' : '▶'}
        </button>

        <span className="text-sm text-text-muted flex-shrink-0">📁</span>

        <button
          onClick={handleToggle}
          className="flex-1 text-left text-sm font-medium text-text-primary hover:text-text-primary transition-colors"
        >
          {collection.name}
        </button>

        {collection.requests.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary/70 text-text-muted rounded-full border border-stroke flex-shrink-0">
            {collection.requests.length}
          </span>
        )}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ⋯
          </button>
        </div>
      </div>

      {showMenu && !showConfirm && (
        <div className="flex justify-end pr-1">
          <div className="bg-bg-secondary/95 border border-stroke rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] min-w-max backdrop-blur">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary/60 text-sm transition-colors"
            >
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="block w-full text-left px-4 py-2 text-danger hover:bg-bg-tertiary/60 text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="flex justify-end pr-1">
          <div className="bg-bg-secondary/95 border border-danger/60 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-2 min-w-max backdrop-blur">
            <div className="text-xs text-text-primary mb-2 whitespace-nowrap">
              Delete "{collection.name}"?
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="px-2 py-1 text-xs bg-bg-tertiary/70 text-text-primary rounded-md hover:bg-bg-tertiary transition-colors"
              >
                No
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                  setShowConfirm(false);
                }}
                className="px-2 py-1 text-xs bg-danger text-white rounded-md hover:bg-danger/90 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-1 pl-6 border-l border-bg-tertiary/60">
          {collection.isLoadingRequests ? (
            <div className="py-2">
              <SkeletonGroup type="collection-item" count={2} />
            </div>
          ) : collection.requests.length === 0 ? (
            <div className="py-1 text-xs text-text-muted">
              No requests
            </div>
          ) : (
            collection.requests.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                onLoad={() => onLoadRequest(request)}
                onRename={() => onRenameRequest(request)}
                onDelete={() => onDeleteRequest(request)}
                onTags={onTagRequest ? () => onTagRequest(request) : undefined}
                showSelect={showRequestSelect}
                isSelected={isRequestSelected ? isRequestSelected(request.id) : false}
                onSelect={(selected) => onSelectRequest?.(request.id, selected)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
