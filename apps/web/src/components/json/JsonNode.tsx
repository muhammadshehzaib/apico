'use client';

import React, { memo, useState } from 'react';
import {
  getType,
  getSize,
  buildPath,
  formatValue,
  type JsonValueType,
} from '@/utils/json.util';

interface JsonNodeProps {
  keyName: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  isCollapsed: boolean;
  isMatch: boolean;
  isHovered: boolean;
  copiedPath: string | null;
  onToggleCollapse: (path: string) => void;
  onCopyValue: (path: string, value: unknown) => void;
  onCopyPath: (path: string) => void;
  onHover: (path: string | null) => void;
  searchQuery: string;
  onContextMenu?: (path: string, x: number, y: number) => void;
  activePath?: string | null;
  onHoverPath?: (path: string | null) => void;
}

const JsonNode = memo(function JsonNode({
  keyName,
  value,
  path,
  depth,
  isCollapsed,
  isMatch,
  isHovered,
  copiedPath,
  onToggleCollapse,
  onCopyValue,
  onCopyPath,
  onHover,
  searchQuery,
  onContextMenu,
  activePath,
  onHoverPath,
}: JsonNodeProps) {
  const type = getType(value);
  const size = getSize(value);
  const [showMore, setShowMore] = useState(false);

  const isContainer = type === 'object' || type === 'array';
  const paddingLeft = depth * 20;

  const keyColor = isMatch && searchQuery ? 'text-accent' : 'text-gray-300';
  const matchBg =
    isMatch && searchQuery ? 'bg-blue-900 bg-opacity-30' : 'hover:bg-gray-800 hover:bg-opacity-20';

  // For arrays with > 100 items, only show first 100
  const items = Array.isArray(value) ? value : [];
  const displayItems = showMore ? items : items.slice(0, 100);
  const hasMoreItems = items.length > 100 && !showMore;

  const renderValue = () => {
    switch (type) {
      case 'null':
        return <span className="text-gray-500">null</span>;

      case 'boolean':
        return (
          <span className={value === true ? 'text-green-400' : 'text-red-400'}>
            {value === true ? 'true' : 'false'}
          </span>
        );

      case 'number':
        return <span className="text-blue-400">{String(value)}</span>;

      case 'string':
        return <span className="text-green-400">{formatValue(value)}</span>;

      case 'object':
        if (isCollapsed) {
          return (
            <>
              <span className="text-gray-500">{'{'}</span>
              <span className="text-gray-600 text-xs ml-1">
                {size} {size === 1 ? 'key' : 'keys'}
              </span>
              <span className="text-gray-500">{'}'}</span>
            </>
          );
        }
        return <span className="text-gray-500">{'{'}</span>;

      case 'array':
        if (isCollapsed) {
          return (
            <>
              <span className="text-gray-500">{'['}</span>
              <span className="text-gray-600 text-xs ml-1">
                {size} {size === 1 ? 'item' : 'items'}
              </span>
              <span className="text-gray-500">{']'}</span>
            </>
          );
        }
        return <span className="text-gray-500">{'['}</span>;

      default:
        return null;
    }
  };

  const renderChildrenEnd = () => {
    if (type === 'object') return <span className="text-gray-500">{'}'}</span>;
    if (type === 'array') return <span className="text-gray-500">{']'}</span>;
    return null;
  };

  if (isContainer) {
    return (
      <div
        className={`font-mono text-sm ${matchBg} ${activePath === path ? 'bg-blue-900 bg-opacity-40' : ''} transition-colors`}
        onMouseEnter={() => {
          onHover(path);
          if (onHoverPath) onHoverPath(path);
        }}
        onMouseLeave={() => {
          onHover(null);
          if (onHoverPath) onHoverPath(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (onContextMenu) {
            onContextMenu(path, e.clientX, e.clientY);
          }
        }}
      >
        {/* Header line */}
        <div
          className="flex items-center gap-2 cursor-pointer group relative"
          onClick={() => onToggleCollapse(path)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(path, e.clientX, e.clientY);
            }
          }}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <button
            className="text-gray-500 font-bold w-4 text-center flex-shrink-0"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>

          {keyName !== null && (
            <>
              <span className={`${keyColor} font-medium`}>
                "{keyName}":
              </span>
            </>
          )}

          {renderValue()}

          {/* Copy buttons - always rendered, shown on hover via opacity */}
          <div className={`flex items-center gap-1 ml-auto flex-shrink-0 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyValue(path, value);
              }}
              className={`px-2 py-0.5 text-xs rounded transition-colors flex-shrink-0 ${copiedPath === path
                ? 'bg-success text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
            >
              {copiedPath === path ? '✓' : 'val'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyPath(path);
              }}
              className={`px-2 py-0.5 text-xs rounded transition-colors flex-shrink-0 ${copiedPath === `${path}_path`
                ? 'bg-success text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
            >
              {copiedPath === `${path}_path` ? '✓' : 'path'}
            </button>
          </div>
        </div>

        {/* Children */}
        {!isCollapsed && (
          <>
            {type === 'object' && value !== null && (
              <>
                {Object.entries(value as Record<string, unknown>).map(
                  ([k, v]) => (
                    <JsonNode
                      key={k}
                      keyName={k}
                      value={v}
                      path={buildPath(path, k)}
                      depth={depth + 1}
                      isCollapsed={false}
                      isMatch={false}
                      isHovered={false}
                      copiedPath={copiedPath}
                      onToggleCollapse={onToggleCollapse}
                      onCopyValue={onCopyValue}
                      onCopyPath={onCopyPath}
                      onHover={onHover}
                      searchQuery={searchQuery}
                      onContextMenu={onContextMenu}
                      activePath={activePath}
                      onHoverPath={onHoverPath}
                    />
                  )
                )}
              </>
            )}

            {type === 'array' && Array.isArray(value) && (
              <>
                {displayItems.map((item, i) => (
                  <JsonNode
                    key={i}
                    keyName={i}
                    value={item}
                    path={buildPath(path, i)}
                    depth={depth + 1}
                    isCollapsed={false}
                    isMatch={false}
                    isHovered={false}
                    copiedPath={copiedPath}
                    onToggleCollapse={onToggleCollapse}
                    onCopyValue={onCopyValue}
                    onCopyPath={onCopyPath}
                    onHover={onHover}
                    searchQuery={searchQuery}
                    onContextMenu={onContextMenu}
                    activePath={activePath}
                    onHoverPath={onHoverPath}
                  />
                ))}

                {hasMoreItems && (
                  <div
                    className="text-gray-600 text-xs cursor-pointer hover:text-gray-400 transition-colors"
                    onClick={() => setShowMore(true)}
                    style={{ paddingLeft: `${(depth + 1) * 20}px` }}
                  >
                    ... {items.length - 100} more items [Show all]
                  </div>
                )}
              </>
            )}

            {/* Closing bracket */}
            <div style={{ paddingLeft: `${paddingLeft}px` }}>
              {renderChildrenEnd()},
            </div>
          </>
        )}
      </div>
    );
  }

  // Primitive values
  return (
    <div
      className={`font-mono text-sm ${matchBg} ${activePath === path ? 'bg-blue-900 bg-opacity-40' : ''} transition-colors`}
      onMouseEnter={() => {
        onHover(path);
        if (onHoverPath) onHoverPath(path);
      }}
      onMouseLeave={() => {
        onHover(null);
        if (onHoverPath) onHoverPath(null);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) {
          onContextMenu(path, e.clientX, e.clientY);
        }
      }}
    >
      <div
        className="flex items-center gap-2 group relative"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {keyName !== null && (
          <span className={`${keyColor} font-medium`}>
            "{keyName}":
          </span>
        )}

        {renderValue()}

        {/* Copy buttons - always rendered, shown on hover via opacity */}
        <div className={`flex items-center gap-1 ml-auto flex-shrink-0 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyValue(path, value);
            }}
            className={`px-2 py-0.5 text-xs rounded transition-colors flex-shrink-0 ${copiedPath === path
              ? 'bg-success text-white'
              : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
          >
            {copiedPath === path ? '✓' : 'val'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyPath(path);
            }}
            className={`px-2 py-0.5 text-xs rounded transition-colors flex-shrink-0 ${copiedPath === `${path}_path`
              ? 'bg-success text-white'
              : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
          >
            {copiedPath === `${path}_path` ? '✓' : 'path'}
          </button>
        </div>

        <span className="text-gray-500">,</span>
      </div>
    </div>
  );
});

export default JsonNode;
