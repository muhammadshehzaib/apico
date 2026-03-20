'use client';

import { useEffect, useRef } from 'react';
import { getAllFormats, copyToClipboard } from '@/utils/json.util';

interface JsonContextMenuProps {
  path: string | null;
  x: number;
  y: number;
  onClose: () => void;
  onCopyPath: (path: string, format: string) => void;
  onExpandChildren?: (path: string) => void;
  onCollapseChildren?: (path: string) => void;
  isContainer?: boolean;
}

export function JsonContextMenu({
  path,
  x,
  y,
  onClose,
  onCopyPath,
  onExpandChildren,
  onCollapseChildren,
  isContainer,
}: JsonContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!path) return null;

  const formats = getAllFormats(path);

  const handleCopy = async (code: string, format: string) => {
    await copyToClipboard(code);
    onCopyPath(path, format);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-bg-secondary border border-bg-tertiary rounded shadow-lg z-50 min-w-max"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="py-1">
        <div className="px-3 py-1.5 text-xs text-text-muted font-medium border-b border-bg-tertiary">
          Copy path as
        </div>

        {formats.map((format) => (
          <button
            key={format.format}
            onClick={() => handleCopy(format.code, format.format)}
            className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-between group"
          >
            <div className="flex flex-col">
              <span className="font-medium">{format.label}</span>
              <code className="text-text-muted text-xs font-mono group-hover:text-text-primary truncate max-w-xs">
                {format.code}
              </code>
            </div>
          </button>
        ))}

        {isContainer && (
          <>
            <div className="border-t border-bg-tertiary my-1" />

            {onExpandChildren && (
              <button
                onClick={() => {
                  onExpandChildren(path || '');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                ⊞ Expand all children
              </button>
            )}

            {onCollapseChildren && (
              <button
                onClick={() => {
                  onCollapseChildren(path || '');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                ⊟ Collapse all children
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
