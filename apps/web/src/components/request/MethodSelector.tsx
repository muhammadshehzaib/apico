'use client';

import { useRef, useState, useEffect } from 'react';
import { HttpMethod } from '@/types';
import { HTTP_METHOD_TAILWIND } from '@/constants/app.constants';

interface MethodSelectorProps {
  method: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const methods: HttpMethod[] = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE];

const methodColors: Record<HttpMethod, string> = {
  [HttpMethod.GET]: 'bg-success/20 text-success border-success/40',
  [HttpMethod.POST]: 'bg-accent/20 text-accent border-accent/40',
  [HttpMethod.PUT]: 'bg-warning/20 text-warning border-warning/40',
  [HttpMethod.PATCH]: 'bg-info/20 text-info border-info/40',
  [HttpMethod.DELETE]: 'bg-danger/20 text-danger border-danger/40',
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${methodColors[method]} border font-mono font-semibold px-4 py-2 rounded-md min-w-[110px] text-center transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]`}
      >
        {method}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-bg-secondary/95 border border-stroke rounded-md shadow-[0_24px_60px_rgba(0,0,0,0.45)] z-50 min-w-[110px] backdrop-blur">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 ${methodColors[m]} border font-semibold hover:brightness-110 transition-all first:rounded-t last:rounded-b`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
