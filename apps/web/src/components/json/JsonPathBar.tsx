'use client';

import { useState } from 'react';
import { getPathInFormat, type PathFormat } from '@/utils/json.util';
import { copyToClipboard } from '@/utils/json.util';

interface JsonPathBarProps {
  path: string | null;
  hoveredPath?: string | null;
  format: PathFormat;
  onFormatChange: (format: PathFormat) => void;
  onCycleFormat: () => void;
  copiedPath?: string | null;
}

export function JsonPathBar({
  path,
  hoveredPath,
  format,
  onFormatChange,
  onCycleFormat,
  copiedPath,
}: JsonPathBarProps) {
  const [copied, setCopied] = useState(false);

  // Show hovered path in real-time, or selected path if nothing hovered
  const displayPath = hoveredPath || path;
  const isHovering = hoveredPath && hoveredPath !== path;

  if (!displayPath) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-bg-primary border-b border-bg-tertiary text-text-muted text-sm">
        Hover or click any value to see its path
      </div>
    );
  }

  const formattedPath = getPathInFormat(displayPath, format);

  const handleCopyPath = async () => {
    await copyToClipboard(formattedPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCopied = copied || copiedPath === displayPath;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-bg-primary border-b border-bg-tertiary gap-2">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-text-muted text-xs font-medium flex-shrink-0">
          {isHovering ? '👁 ' : '✓ '}Path:
        </span>
        <code className={`flex-1 text-xs font-mono rounded px-2 py-1 overflow-auto ${
          isHovering
            ? 'bg-blue-900 bg-opacity-30 text-blue-300'
            : 'bg-bg-secondary text-text-primary'
        }`}>
          {formattedPath}
        </code>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCycleFormat}
          title="Cycle format (F)"
          className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
        >
          ⟲
        </button>

        <button
          onClick={handleCopyPath}
          title="Copy path (P)"
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isCopied
              ? 'bg-success text-white'
              : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
          }`}
        >
          {isCopied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  );
}
