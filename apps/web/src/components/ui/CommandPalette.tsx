'use client';

import { useEffect, useRef, useState } from 'react';

export type CommandPaletteItem = {
  id: string;
  type: 'request' | 'collection';
  title: string;
  subtitle?: string;
  pinned?: boolean;
  data: any;
};

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  items: CommandPaletteItem[];
  isLoading?: boolean;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelect: (item: CommandPaletteItem) => void;
  onTogglePin?: (item: CommandPaletteItem) => void;
}

export function CommandPalette({
  isOpen,
  query,
  items,
  isLoading = false,
  onQueryChange,
  onClose,
  onSelect,
  onTogglePin,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) onSelect(item);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, activeIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-bg-secondary/95 border border-stroke rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-bg-tertiary/60">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search requests or collections..."
            className="w-full px-4 py-3 bg-bg-primary/80 border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 text-text-primary"
          />
        </div>

        <div className="max-h-[60vh] overflow-auto">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-text-muted">
              {isLoading ? 'Searching...' : 'No results'}
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => onSelect(item)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  index === activeIndex
                    ? 'bg-bg-tertiary/70'
                    : 'hover:bg-bg-tertiary/60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-stroke text-text-muted uppercase">
                      {item.type}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {item.title}
                    </span>
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-text-muted mt-1">{item.subtitle}</div>
                  )}
                </div>

                {item.type === 'request' && onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(item);
                    }}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      item.pinned
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-bg-primary/60 text-text-muted border-stroke'
                    }`}
                  >
                    {item.pinned ? 'Pinned' : 'Pin'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
