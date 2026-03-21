'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BodyEditorProps {
  body: string;
  onChange: (body: string) => void;
}

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const [mode, setMode] = useState<'json' | 'raw'>('json');
  const [isInvalidJson, setIsInvalidJson] = useState(false);

  const handleChange = (value: string) => {
    onChange(value);
    if (mode === 'json') {
      try {
        if (value.trim()) {
          JSON.parse(value);
          setIsInvalidJson(false);
        } else {
          setIsInvalidJson(false);
        }
      } catch {
        setIsInvalidJson(true);
      }
    }
  };

  const handleFormat = () => {
    try {
      if (body.trim()) {
        const parsed = JSON.parse(body);
        const formatted = JSON.stringify(parsed, null, 2);
        onChange(formatted);
        setIsInvalidJson(false);
      }
    } catch {
      setIsInvalidJson(true);
    }
  };

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="flex gap-2 items-center flex-shrink-0">
        <button
          onClick={() => setMode('json')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'json'
              ? 'bg-accent text-white'
              : 'bg-bg-secondary text-text-muted hover:text-text-primary'
            }`}
        >
          JSON
        </button>
        <button
          onClick={() => setMode('raw')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'raw'
              ? 'bg-accent text-white'
              : 'bg-bg-secondary text-text-muted hover:text-text-primary'
            }`}
        >
          Raw
        </button>

        {mode === 'json' && (
          <button
            onClick={handleFormat}
            className="ml-auto px-3 py-1.5 rounded text-sm font-medium bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
          >
            Format
          </button>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Enter request body..."
        className={`w-full p-3 bg-bg-primary border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent flex-1 min-h-0 ${isInvalidJson ? 'border-danger' : 'border-bg-tertiary'
          }`}
      />

      {isInvalidJson && (
        <div className="text-danger text-xs">Invalid JSON</div>
      )}
    </div>
  );
}
