'use client';

import { useEffect, useRef } from 'react';
import { HttpMethod } from '@/types';
import { MethodSelector } from './MethodSelector';
import { EnvironmentSelector } from '@/components/environment/EnvironmentSelector';
import { Button } from '@/components/ui/Button';
import { resolveVariables, extractVariables } from '@/utils/variable.util';
import { Environment, EnvironmentVariable } from '@/services/environment.service';
import type { GuestEnvironment } from '@/utils/playground.storage';

interface UrlBarProps {
  method: HttpMethod;
  url: string;
  urlError: string | null;
  isLoading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCurlImport: () => void;
  environments: (Environment | GuestEnvironment)[];
  activeEnvironment: Environment | GuestEnvironment | null;
  onEnvironmentSelect: (id: string | null) => void;
  onManageEnvironments: () => void;
}

export function UrlBar({
  method,
  url,
  urlError,
  isLoading,
  onMethodChange,
  onUrlChange,
  onSend,
  onCurlImport,
  environments,
  activeEnvironment,
  onEnvironmentSelect,
  onManageEnvironments,
}: UrlBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const activeVariables = activeEnvironment?.variables || [];
  const resolvedUrl = resolveVariables(url, activeVariables);
  const hasVariables = extractVariables(url).length > 0;

  // Shake animation when there's an error
  useEffect(() => {
    if (urlError && inputRef.current) {
      inputRef.current.classList.remove('animate-shake');
      void inputRef.current.offsetWidth;
      inputRef.current.classList.add('animate-shake');
    }
  }, [urlError]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onSend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSend]);

  return (
    <div className="bg-bg-secondary border-b border-bg-tertiary p-4 space-y-2">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      <div className="flex items-center gap-3">
        <MethodSelector method={method} onChange={onMethodChange} />

        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Enter request URL"
          className={`flex-1 px-4 py-2 bg-bg-primary border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent ${urlError ? 'border-danger' : 'border-bg-tertiary focus:border-accent'
            }`}
        />

        <Button
          onClick={onCurlImport}
          variant="ghost"
          size="md"
          title="Import from curl command"
          className="px-3"
        >
          ↓ curl
        </Button>

        <EnvironmentSelector
          environments={environments}
          activeEnvironment={activeEnvironment}
          onSelect={onEnvironmentSelect}
          onManage={onManageEnvironments}
        />

        <Button
          onClick={onSend}
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isLoading}
          title="Ctrl+Enter to send"
        >
          {isLoading ? '' : 'Send'}
        </Button>
      </div>

      {hasVariables && (
        <div className="text-xs text-text-muted px-4 py-1 bg-bg-primary rounded border border-bg-tertiary">
          Resolves to:{' '}
          <span className="text-text-primary font-mono">{resolvedUrl}</span>
        </div>
      )}

      {urlError && (
        <div className="mt-2 text-danger text-sm">{urlError}</div>
      )}
    </div>
  );
}
