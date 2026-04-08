'use client';

import { useRef, useState, useEffect } from 'react';
import { HttpMethod } from '@/types';
import { HTTP_METHOD_COLORS } from '@/constants/app.constants';

interface MethodSelectorProps {
  method: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const methods: HttpMethod[] = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE];

// Postman-like palette for method accents
const methodAccent: Record<HttpMethod, string> = {
  [HttpMethod.GET]: '#6BBE45',
  [HttpMethod.POST]: '#FF6C37',
  [HttpMethod.PUT]: '#4A90E2',
  [HttpMethod.PATCH]: '#B38CF6',
  [HttpMethod.DELETE]: '#E74C3C',
};

export function MethodSelector({ method, onChange }: MethodSelectorProps) {
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
    <div className="relative z-[120]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative overflow-hidden bg-bg-secondary/90 border border-stroke font-mono font-semibold px-4 py-2 rounded-md min-w-[110px] text-center transition-all hover:bg-bg-tertiary/70 hover:border-accent/40"
      >
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: methodAccent[method] }}
        />
        <span className="relative z-10" style={{ color: methodAccent[method] }}>
          {method}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-bg-secondary/95 border border-stroke rounded-md shadow-[0_24px_60px_rgba(0,0,0,0.45)] z-[200] min-w-[110px] overflow-hidden">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setIsOpen(false);
              }}
              className="relative overflow-hidden bg-bg-secondary/95 w-full text-left px-4 py-2 font-semibold transition-all hover:bg-bg-tertiary/70 border-b border-bg-tertiary/60 last:border-b-0"
            >
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: methodAccent[m] }}
              />
              <span className="relative z-10" style={{ color: methodAccent[m] }}>
                {m}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
