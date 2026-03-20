'use client';

import { useState, useEffect } from 'react';
import { useJsonTree } from '@/hooks/useJsonTree';
import { useJsonPath } from '@/hooks/useJsonPath';
import { JsonToolbar } from './JsonToolbar';
import { JsonSearchBar } from './JsonSearchBar';
import { JsonPathBar } from './JsonPathBar';
import { JsonContextMenu } from './JsonContextMenu';
import JsonNode from './JsonNode';
import { getType, buildPath, getPathInFormat, copyToClipboard, getValueAtPath, formatValue } from '@/utils/json.util';
import { PathFormatSelector } from './PathFormatSelector';

interface JsonTreeViewerProps {
  body: string;
  headers?: Record<string, string | string[]>;
}

export function JsonTreeViewer({ body, headers }: JsonTreeViewerProps) {
  const [displayMode, setDisplayMode] = useState<'tree' | 'raw'>('tree');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const jsonPath = useJsonPath();

  const tree = useJsonTree(body);

  // Keyboard shortcuts for path operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if in input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!jsonPath.activePath && e.key.toLowerCase() !== 'f') return;

      // P: Copy path in current format
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const pathCode = getPathInFormat(jsonPath.activePath || '', jsonPath.pathFormat);
        copyToClipboard(pathCode);
        jsonPath.setCopied(jsonPath.activePath);
      }

      // V: Copy value
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (jsonPath.activePath && tree.parsedData) {
          const value = getValueAtPath(tree.parsedData, jsonPath.activePath);
          let valueStr = '';
          if (typeof value === 'string') {
            valueStr = value;
          } else if (value === null) {
            valueStr = 'null';
          } else if (typeof value === 'object') {
            valueStr = JSON.stringify(value, null, 2);
          } else {
            valueStr = String(value);
          }
          copyToClipboard(valueStr);
          jsonPath.setCopied(`${jsonPath.activePath}_value`);
        }
      }

      // F: Cycle through formats
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        jsonPath.cycleFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jsonPath.activePath, jsonPath.pathFormat, jsonPath.cycleFormat, jsonPath.setCopied, tree.parsedData]);

  if (!body) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Empty response body
      </div>
    );
  }

  if (!tree.isValid) {
    return (
      <div className="flex flex-col h-full">
        <JsonToolbar
          displayMode="raw"
          onDisplayModeChange={() => {}}
          onExpandAll={() => {}}
          onCollapseAll={() => {}}
          onToggleSearch={() => {}}
          isSearchOpen={false}
          onCopyAll={() => {}}
          isCopied={false}
        />

        <div className="flex-1 overflow-auto p-4">
          <div className="text-danger text-sm mb-4">
            Response is not valid JSON. Showing raw text instead.
          </div>
          <pre className="text-text-primary text-xs font-mono whitespace-pre-wrap break-words">
            {body}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <JsonToolbar
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        onExpandAll={tree.expandAll}
        onCollapseAll={tree.collapseAll}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
        onCopyAll={tree.copyAll}
        isCopied={tree.copiedPath === 'all'}
        pathFormat={jsonPath.pathFormat}
        onPathFormatChange={jsonPath.setPathFormat}
        onCyclePathFormat={jsonPath.cycleFormat}
      />

      {displayMode === 'tree' && (jsonPath.activePath || jsonPath.hoveredPath) && (
        <JsonPathBar
          path={jsonPath.activePath}
          hoveredPath={jsonPath.hoveredPath}
          format={jsonPath.pathFormat}
          onFormatChange={jsonPath.setPathFormat}
          onCycleFormat={jsonPath.cycleFormat}
          copiedPath={jsonPath.copiedPath}
        />
      )}

      {displayMode === 'tree' && isSearchOpen && (
        <JsonSearchBar
          query={tree.searchQuery}
          onChange={tree.setSearchQuery}
          matchCount={tree.matchingPaths.size}
          onClear={() => {
            tree.setSearchQuery('');
            setIsSearchOpen(false);
          }}
        />
      )}

      {displayMode === 'tree' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-1 overflow-auto p-2 font-mono text-sm text-text-primary"
            onKeyDown={(e) => {
              // Keyboard navigation
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            tabIndex={0}
          >
            {tree.parsedData !== null && (
              <div className="space-y-0">
                <JsonNode
                  keyName={null}
                  value={tree.parsedData}
                  path=""
                  depth={0}
                  isCollapsed={tree.isCollapsed('')}
                  isMatch={tree.isMatch('')}
                  isHovered={tree.hoveredPath === ''}
                  copiedPath={tree.copiedPath}
                  onToggleCollapse={tree.toggleCollapse}
                  onCopyValue={tree.copyValue}
                  onCopyPath={tree.copyPath}
                  onHover={tree.setHoveredPath}
                  searchQuery={tree.searchQuery}
                  onContextMenu={jsonPath.showContextMenu}
                  activePath={jsonPath.activePath}
                  onHoverPath={jsonPath.setHoveredPath}
                />
              </div>
            )}
          </div>

          {jsonPath.activePath && (
            <div className="border-t border-bg-tertiary px-4 py-1 bg-bg-secondary text-text-muted text-xs">
              <span className="inline-block">P</span>
              <span className="mx-1">=</span>
              <span>copy path</span>
              <span className="mx-2">•</span>
              <span className="inline-block">V</span>
              <span className="mx-1">=</span>
              <span>copy value</span>
              <span className="mx-2">•</span>
              <span className="inline-block">F</span>
              <span className="mx-1">=</span>
              <span>cycle format</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 bg-bg-primary">
          <pre className="text-text-primary text-xs font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(tree.parsedData, null, 2)}
          </pre>
        </div>
      )}

      {jsonPath.contextMenu && jsonPath.contextMenuPath && (
        <JsonContextMenu
          path={jsonPath.contextMenuPath}
          x={jsonPath.contextMenu.x}
          y={jsonPath.contextMenu.y}
          onClose={jsonPath.hideContextMenu}
          onCopyPath={jsonPath.setActivePath}
          onExpandChildren={tree.expandChildren}
          onCollapseChildren={tree.collapseChildren}
          isContainer={
            tree.parsedData
              ? ['object', 'array'].includes(getType(getValueAtPath(tree.parsedData, jsonPath.contextMenuPath)))
              : false
          }
        />
      )}
    </div>
  );
}
