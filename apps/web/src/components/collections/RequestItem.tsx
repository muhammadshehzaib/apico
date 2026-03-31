'use client';

import { useRef, useState, useEffect } from 'react';
import { SavedRequest } from '@/types';
import { HTTP_METHOD_TAILWIND } from '@/constants/app.constants';

interface RequestItemProps {
  request: SavedRequest;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function RequestItem({ request, onLoad, onRename, onDelete }: RequestItemProps) {
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
    GET: 'bg-success/20 text-success border-success/40',
    POST: 'bg-accent/20 text-accent border-accent/40',
    PUT: 'bg-warning/20 text-warning border-warning/40',
    PATCH: 'bg-info/20 text-info border-info/40',
    DELETE: 'bg-danger/20 text-danger border-danger/40',
  };

  return (
    <div
      onClick={onLoad}
      className="flex items-center gap-2 px-3 py-2 h-8 pl-8 rounded-md hover:bg-bg-tertiary/60 transition-colors cursor-pointer group relative border border-transparent hover:border-stroke/60"
    >
      <span
        className={`${methodColorMap[request.method]} border text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0`}
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
          <div className="absolute right-0 mt-2 bg-bg-secondary/95 border border-stroke rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] z-50 min-w-max backdrop-blur">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoad();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary/60 text-sm transition-colors"
            >
              Load
            </button>
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
        )}

        {showConfirm && (
          <div className="absolute right-0 mt-2 bg-bg-secondary/95 border border-danger/60 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] z-50 p-2 min-w-max backdrop-blur">
            <div className="text-xs text-text-primary mb-2 whitespace-nowrap">
              Delete "{request.name}"?
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
        )}
      </div>
    </div>
  );
}
