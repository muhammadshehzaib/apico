'use client';

import { useRef, useState, useEffect } from 'react';
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
}: CollectionItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-1">
      <div className="flex items-center gap-2 h-8 rounded hover:bg-bg-tertiary transition-colors group">
        <button
          onClick={onToggle}
          className="px-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          {isExpanded ? '▼' : '▶'}
        </button>

        <span className="text-sm text-text-muted flex-shrink-0">📁</span>

        <button
          onClick={onToggle}
          className="flex-1 text-left text-sm font-medium text-text-primary hover:text-text-primary transition-colors"
        >
          {collection.name}
        </button>

        {collection.requests.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-text-muted rounded-full flex-shrink-0">
            {collection.requests.length}
          </span>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ⋯
          </button>

          {showMenu && !showConfirm && (
            <div className="absolute right-0 mt-1 bg-bg-secondary border border-bg-tertiary rounded shadow-lg z-50 min-w-max">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary text-sm transition-colors"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="block w-full text-left px-4 py-2 text-danger hover:bg-bg-tertiary text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {showConfirm && (
            <div className="absolute right-0 mt-1 bg-bg-secondary border border-danger rounded shadow-lg z-50 p-2 min-w-max">
              <div className="text-xs text-text-primary mb-2 whitespace-nowrap">
                Delete "{collection.name}"?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(false);
                  }}
                  className="px-2 py-1 text-xs bg-bg-tertiary text-text-primary rounded hover:bg-bg-primary transition-colors"
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
                  className="px-2 py-1 text-xs bg-danger text-white rounded hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1">
          {collection.isLoadingRequests ? (
            <div className="pl-8 py-2">
              <SkeletonGroup type="collection-item" count={2} />
            </div>
          ) : collection.requests.length === 0 ? (
            <div className="pl-8 py-1 text-xs text-text-muted">
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
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
