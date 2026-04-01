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
  [HttpMethod.GET]: 'before:bg-success text-success border-success/40',
  [HttpMethod.POST]: 'before:bg-accent text-accent border-accent/40',
  [HttpMethod.PUT]: 'before:bg-warning text-warning border-warning/40',
  [HttpMethod.PATCH]: 'before:bg-info text-info border-info/40',
  [HttpMethod.DELETE]: 'before:bg-danger text-danger border-danger/40',
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
        className={`relative overflow-hidden bg-bg-secondary ${methodColors[method]} border font-mono font-semibold px-4 py-2 rounded-md min-w-[110px] text-center transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none`}
      >
        <span className="relative z-10">{method}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-bg-secondary border border-stroke rounded-md shadow-[0_24px_60px_rgba(0,0,0,0.45)] z-[200] min-w-[110px] overflow-hidden">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setIsOpen(false);
              }}
              className={`relative overflow-hidden bg-bg-secondary w-full text-left px-4 py-2 ${methodColors[m]} border font-semibold hover:brightness-110 transition-all first:rounded-t last:rounded-b before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none`}
            >
              <span className="relative z-10">{m}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
