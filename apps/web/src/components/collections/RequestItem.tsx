'use client';

import { useRef, useState, useEffect } from 'react';
import { SavedRequest } from '@/types';
import { HTTP_METHOD_TAILWIND } from '@/constants/app.constants';

interface RequestItemProps {
  request: SavedRequest;
  onLoad: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function RequestItem({ request, onLoad, onRename, onShare, onDelete }: RequestItemProps) {
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

  const methodColorMap: Record<string, string> = {
    GET: 'bg-success',
    POST: 'bg-accent',
    PUT: 'bg-warning',
    PATCH: 'bg-info',
    DELETE: 'bg-danger',
  };

  return (
    <div
      onClick={onLoad}
      className="flex items-center gap-2 px-3 py-2 h-8 pl-8 rounded hover:bg-bg-tertiary transition-colors cursor-pointer group relative"
    >
      <span
        className={`${methodColorMap[request.method]} text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0`}
      >
        {request.method}
      </span>

      <span className="text-xs font-mono text-text-primary truncate flex-1">
        {request.name}
      </span>

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
                onLoad();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary text-sm transition-colors"
            >
              Load
            </button>
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
                onShare();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary text-sm transition-colors"
            >
              Share
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
              Delete "{request.name}"?
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
  );
}
