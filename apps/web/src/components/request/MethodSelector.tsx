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
  [HttpMethod.GET]: 'bg-success',
  [HttpMethod.POST]: 'bg-accent',
  [HttpMethod.PUT]: 'bg-warning',
  [HttpMethod.PATCH]: 'bg-info',
  [HttpMethod.DELETE]: 'bg-danger',
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
        className={`${methodColors[method]} text-white font-mono font-semibold px-4 py-2 rounded min-w-[110px] text-center transition-opacity hover:opacity-90`}
      >
        {method}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-bg-tertiary rounded shadow-lg z-50 min-w-[110px]">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 ${methodColors[m]} text-white font-semibold hover:opacity-90 transition-opacity first:rounded-t last:rounded-b`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
