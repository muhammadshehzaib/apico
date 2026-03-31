'use client';

import { useRef, useState, useEffect } from 'react';
import { Environment } from '@/services/environment.service';
import type { GuestEnvironment } from '@/utils/playground.storage';

interface EnvironmentSelectorProps {
  environments: (Environment | GuestEnvironment)[];
  activeEnvironment: Environment | GuestEnvironment | null;
  onSelect: (id: string | null) => void;
  onManage: () => void;
}

export function EnvironmentSelector({
  environments,
  activeEnvironment,
  onSelect,
  onManage,
}: EnvironmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-bg-primary/80 border border-stroke rounded-md hover:border-accent/60 transition-colors text-text-primary text-sm font-medium"
        title="Select environment"
      >
        <span>🌍</span>
        <span>{activeEnvironment?.name || 'No Environment'}</span>
        <span>▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-bg-secondary/95 border border-stroke rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] z-50 min-w-[180px] backdrop-blur">
          <div className="py-1">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => {
                  onSelect(env.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary/60 transition-colors flex items-center justify-between text-sm"
              >
                <span>{env.name}</span>
                {activeEnvironment?.id === env.id && <span>✓</span>}
              </button>
            ))}

            <div className="border-t border-bg-tertiary/60 my-1" />

            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-text-muted hover:bg-bg-tertiary/60 hover:text-text-primary transition-colors text-sm flex items-center justify-between"
            >
              <span>✕ No Environment</span>
              {!activeEnvironment && <span>✓</span>}
            </button>

            <div className="border-t border-bg-tertiary/60 my-1" />

            <button
              onClick={() => {
                onManage();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-accent hover:bg-bg-tertiary/60 transition-colors text-sm"
            >
              ⚙ Manage Environments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
