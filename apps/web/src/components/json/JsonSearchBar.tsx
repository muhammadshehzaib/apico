'use client';

import { useEffect, useRef } from 'react';

interface JsonSearchBarProps {
  query: string;
  onChange: (query: string) => void;
  matchCount: number;
  onClear: () => void;
}

export function JsonSearchBar({
  query,
  onChange,
  matchCount,
  onClear,
}: JsonSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-bg-primary border-b border-bg-tertiary h-9">
      <span className="text-text-muted text-sm">🔍</span>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClear();
          }
        }}
        placeholder="Search keys and values..."
        className="flex-1 bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-muted"
      />

      {query && (
        <button
          onClick={onClear}
          className="text-text-muted hover:text-text-primary text-lg transition-colors flex-shrink-0"
        >
          ×
        </button>
      )}

      {query && (
        <span
          className={`text-xs font-medium flex-shrink-0 ${
            matchCount > 0 ? 'text-accent' : 'text-danger'
          }`}
        >
          {matchCount === 0
            ? 'No matches'
            : `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}
        </span>
      )}
    </div>
  );
}
