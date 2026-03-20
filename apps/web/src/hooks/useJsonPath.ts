import { useState, useCallback } from 'react';
import type { PathFormat } from '@/utils/json.util';

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useJsonPath() {
  const [activePath, setActivePath] = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [pathFormat, setPathFormat] = useState<PathFormat>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('json-path-format');
      return (stored as PathFormat) || 'dot';
    }
    return 'dot';
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const savePathFormat = useCallback((format: PathFormat) => {
    setPathFormat(format);
    if (typeof window !== 'undefined') {
      localStorage.setItem('json-path-format', format);
    }
  }, []);

  const cycleFormat = useCallback(() => {
    const formats: PathFormat[] = ['dot', 'bracket', 'javascript', 'optional-chain', 'lodash', 'python', 'jq', 'jsonpath'];
    const currentIndex = formats.indexOf(pathFormat);
    const nextFormat = formats[(currentIndex + 1) % formats.length];
    savePathFormat(nextFormat);
  }, [pathFormat, savePathFormat]);

  const showContextMenu = useCallback((path: string, x: number, y: number) => {
    setContextMenuPath(path);
    setContextMenu({ x, y });
    setActivePath(path);
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
    setContextMenuPath(null);
  }, []);

  const setCopied = useCallback((path: string | null) => {
    setCopiedPath(path);
    if (path) {
      setTimeout(() => setCopiedPath(null), 2000);
    }
  }, []);

  return {
    activePath,
    setActivePath,
    hoveredPath,
    setHoveredPath,
    pathFormat,
    setPathFormat: savePathFormat,
    cycleFormat,
    contextMenu,
    contextMenuPath,
    showContextMenu,
    hideContextMenu,
    copiedPath,
    setCopied,
  };
}
