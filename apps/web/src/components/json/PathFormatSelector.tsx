'use client';

import { useState, useRef, useEffect } from 'react';
import type { PathFormat } from '@/utils/json.util';

interface PathFormatSelectorProps {
  activeFormat: PathFormat;
  onChange: (format: PathFormat) => void;
}

const formatOptions: Array<{ value: PathFormat; label: string }> = [
  { value: 'dot', label: 'Dot Notation' },
  { value: 'bracket', label: 'Bracket Notation' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'optional-chain', label: 'Optional Chaining' },
  { value: 'lodash', label: 'Lodash _.get()' },
  { value: 'python', label: 'Python' },
  { value: 'jq', label: 'jq' },
  { value: 'jsonpath', label: 'JSONPath' },
];

export function PathFormatSelector({
  activeFormat,
  onChange,
}: PathFormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeLabel = formatOptions.find((opt) => opt.value === activeFormat)?.label || 'Dot';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs font-medium rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
        title="Path format"
      >
        <span>{activeLabel}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-bg-secondary border border-bg-tertiary rounded shadow-lg z-50 min-w-max">
          <div className="py-1">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                  activeFormat === option.value
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeFormat === option.value && <span>✓</span>}
                  {activeFormat !== option.value && <span className="w-4" />}
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
