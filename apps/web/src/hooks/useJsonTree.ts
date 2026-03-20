'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  parseJson,
  getType,
  getSize,
  searchJson,
  copyToClipboard,
} from '@/utils/json.util';

export function useJsonTree(rawJson: string) {
  const [parsedData, setParsedData] = useState<unknown | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQueryState] = useState('');
  const [matchingPaths, setMatchingPaths] = useState<Set<string>>(new Set());
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);

  // Parse JSON on mount or when rawJson changes
  useEffect(() => {
    const parsed = parseJson(rawJson);

    if (parsed === null) {
      setIsValid(false);
      setParsedData(null);
      setCollapsedPaths(new Set());
      return;
    }

    setIsValid(true);
    setParsedData(parsed);

    // Auto-collapse large arrays
    const autoCollapsed = new Set<string>();
    const autoCollapseWalk = (obj: unknown, path: string = ''): void => {
      const type = getType(obj);

      if (type === 'array' && Array.isArray(obj) && obj.length > 10) {
        autoCollapsed.add(path);
      }

      if (type === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(
          obj as Record<string, unknown>
        )) {
          const newPath = path ? `${path}.${key}` : key;
          autoCollapseWalk(value, newPath);
        }
      } else if (type === 'array' && Array.isArray(obj)) {
        for (let i = 0; i < Math.min(obj.length, 10); i++) {
          const newPath = path ? `${path}[${i}]` : `[${i}]`;
          autoCollapseWalk(obj[i], newPath);
        }
      }
    };

    autoCollapseWalk(parsed);
    setCollapsedPaths(autoCollapsed);
    setSearchQueryState('');
    setMatchingPaths(new Set());
    setHoveredPath(null);
    setCopiedPath(null);
    setFocusedPath(null);
  }, [rawJson]);

  const toggleCollapse = useCallback((path: string) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    if (parsedData === null) return;

    const allPaths = new Set<string>();
    const walk = (obj: unknown, path: string = ''): void => {
      const type = getType(obj);

      if (type === 'object' || type === 'array') {
        if (path) allPaths.add(path);

        if (type === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(
            obj as Record<string, unknown>
          )) {
            const newPath = path ? `${path}.${key}` : key;
            walk(value, newPath);
          }
        } else if (type === 'array' && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const newPath = path ? `${path}[${i}]` : `[${i}]`;
            walk(obj[i], newPath);
          }
        }
      }
    };

    walk(parsedData);
    setCollapsedPaths(allPaths);
  }, [parsedData]);

  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
  }, []);

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);

      if (!query.trim()) {
        setMatchingPaths(new Set());
        setCollapsedPaths(new Set());
        return;
      }

      if (parsedData === null) return;

      // Find matches
      const matches = searchJson(parsedData, query);
      setMatchingPaths(matches);

      // Auto-expand paths that contain matches
      setCollapsedPaths((prev) => {
        const next = new Set(prev);
        for (const match of matches) {
          next.delete(match);
        }
        return next;
      });
    },
    [parsedData]
  );

  const copyValue = useCallback((path: string, value: unknown) => {
    const formatted =
      typeof value === 'string'
        ? value
        : typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value);

    copyToClipboard(formatted).then(() => {
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

  const copyPath = useCallback((path: string) => {
    copyToClipboard(path).then(() => {
      setCopiedPath(`${path}_path`);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

  const copyAll = useCallback(() => {
    copyToClipboard(JSON.stringify(parsedData, null, 2)).then(() => {
      setCopiedPath('all');
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, [parsedData]);

  const isCollapsed = useCallback(
    (path: string): boolean => collapsedPaths.has(path),
    [collapsedPaths]
  );

  const isMatch = useCallback(
    (path: string): boolean => {
      if (!searchQuery) return false;
      return matchingPaths.has(path);
    },
    [searchQuery, matchingPaths]
  );

  const expandChildren = useCallback(
    (parentPath: string) => {
      if (parsedData === null) return;

      const value = parentPath === '' ? parsedData : undefined;
      // Get value at path
      const segments = parentPath ? parentPath.split(/[\.\[\]]/).filter(Boolean) : [];
      let current: unknown = parsedData;
      for (const segment of segments) {
        if (current === null || current === undefined) break;
        if (typeof current === 'object') {
          current = (current as Record<string, unknown>)[segment];
        }
      }

      if (!current) return;
      const type = getType(current);

      if (type !== 'object' && type !== 'array') return;

      setCollapsedPaths((prev) => {
        const next = new Set(prev);
        const walk = (obj: unknown, path: string = ''): void => {
          const t = getType(obj);
          if (t === 'object' || t === 'array') {
            if (path && path.startsWith(parentPath)) {
              next.delete(path);
            }

            if (t === 'object' && obj !== null) {
              for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
                const newPath = path ? `${path}.${key}` : key;
                walk(val, newPath);
              }
            } else if (t === 'array' && Array.isArray(obj)) {
              for (let i = 0; i < obj.length; i++) {
                const newPath = path ? `${path}[${i}]` : `[${i}]`;
                walk(obj[i], newPath);
              }
            }
          }
        };

        walk(current, parentPath);
        return next;
      });
    },
    [parsedData]
  );

  const collapseChildren = useCallback(
    (parentPath: string) => {
      if (parsedData === null) return;

      // Get value at path
      const segments = parentPath ? parentPath.split(/[\.\[\]]/).filter(Boolean) : [];
      let current: unknown = parsedData;
      for (const segment of segments) {
        if (current === null || current === undefined) break;
        if (typeof current === 'object') {
          current = (current as Record<string, unknown>)[segment];
        }
      }

      if (!current) return;
      const type = getType(current);

      if (type !== 'object' && type !== 'array') return;

      setCollapsedPaths((prev) => {
        const next = new Set(prev);
        const walk = (obj: unknown, path: string = ''): void => {
          const t = getType(obj);
          if (t === 'object' || t === 'array') {
            if (path && path.startsWith(parentPath) && path !== parentPath) {
              next.add(path);
            }

            if (t === 'object' && obj !== null) {
              for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
                const newPath = path ? `${path}.${key}` : key;
                walk(val, newPath);
              }
            } else if (t === 'array' && Array.isArray(obj)) {
              for (let i = 0; i < obj.length; i++) {
                const newPath = path ? `${path}[${i}]` : `[${i}]`;
                walk(obj[i], newPath);
              }
            }
          }
        };

        walk(current, parentPath);
        return next;
      });
    },
    [parsedData]
  );

  return {
    parsedData,
    isValid,
    collapsedPaths,
    searchQuery,
    matchingPaths,
    hoveredPath,
    copiedPath,
    focusedPath,
    toggleCollapse,
    collapseAll,
    expandAll,
    setSearchQuery,
    setHoveredPath,
    setFocusedPath,
    copyValue,
    copyPath,
    copyAll,
    isCollapsed,
    isMatch,
    expandChildren,
    collapseChildren,
  };
}
