'use client';

import { useState } from 'react';
import type { PathFormat } from '@/utils/json.util';
import { PathFormatSelector } from './PathFormatSelector';

interface JsonToolbarProps {
  displayMode: 'tree' | 'raw';
  onDisplayModeChange: (mode: 'tree' | 'raw') => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onCopyAll: () => void;
  isCopied: boolean;
  pathFormat?: PathFormat;
  onPathFormatChange?: (format: PathFormat) => void;
  onCyclePathFormat?: () => void;
}

export function JsonToolbar({
  displayMode,
  onDisplayModeChange,
  onExpandAll,
  onCollapseAll,
  onToggleSearch,
  isSearchOpen,
  onCopyAll,
  isCopied,
  pathFormat,
  onPathFormatChange,
  onCyclePathFormat,
}: JsonToolbarProps) {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const handleCopyAll = () => {
    onCopyAll();
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-bg-tertiary h-9">
      {/* Left: Display mode toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDisplayModeChange('tree')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            displayMode === 'tree'
              ? 'bg-accent text-white'
              : 'bg-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Tree
        </button>
        <button
          onClick={() => onDisplayModeChange('raw')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            displayMode === 'raw'
              ? 'bg-accent text-white'
              : 'bg-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Raw
        </button>
      </div>

      {/* Right: Tree mode actions */}
      {displayMode === 'tree' && (
        <div className="flex items-center gap-2">
          <button
            onClick={onExpandAll}
            title="Expand all"
            className="px-2 py-1 text-xs bg-bg-tertiary text-text-muted hover:text-text-primary rounded transition-colors"
          >
            ⊞
          </button>

          <button
            onClick={onCollapseAll}
            title="Collapse all"
            className="px-2 py-1 text-xs bg-bg-tertiary text-text-muted hover:text-text-primary rounded transition-colors"
          >
            ⊟
          </button>

          <button
            onClick={onToggleSearch}
            title="Search"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isSearchOpen
                ? 'bg-accent text-white'
                : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
          >
            🔍
          </button>

          <button
            onClick={handleCopyAll}
            title="Copy entire response"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showCopyFeedback || isCopied
                ? 'bg-success text-white'
                : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
          >
            {showCopyFeedback || isCopied ? '✓' : '⎘'}
          </button>

          {pathFormat && onPathFormatChange && (
            <PathFormatSelector
              activeFormat={pathFormat}
              onChange={onPathFormatChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
