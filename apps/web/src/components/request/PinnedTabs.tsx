'use client';

import { SavedRequest } from '@/types';

interface PinnedTabsProps {
  items: SavedRequest[];
  activeId?: string | null;
  onSelect: (request: SavedRequest) => void;
  onUnpin: (id: string) => void;
}

export function PinnedTabs({ items, activeId, onSelect, onUnpin }: PinnedTabsProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-bg-tertiary/60 bg-bg-secondary/90 px-4 py-2 flex items-center gap-2 overflow-x-auto">
      <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted mr-2">
        Pinned
      </span>
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${
            activeId === item.id
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-bg-tertiary/60 text-text-muted border-stroke'
          }`}
        >
          <button onClick={() => onSelect(item)} className="flex items-center gap-2">
            <span className="text-[10px] font-bold">{item.method}</span>
            <span className="truncate max-w-[160px]">{item.name}</span>
          </button>
          <button
            onClick={() => onUnpin(item.id)}
            className="text-text-muted hover:text-text-primary"
            title="Unpin"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
