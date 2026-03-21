'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EnvironmentSelector } from '@/components/environment/EnvironmentSelector';
import { EnvironmentManager } from '@/components/environment/EnvironmentManager';
import { GuestBanner } from './GuestBanner';
import { usePlaygroundEnvironment } from '@/hooks/usePlaygroundEnvironment';
import { formatTimeAgo, truncateUrl } from '@/utils/format.util';
import type { GuestHistoryEntry } from '@/utils/playground.storage';

interface PlaygroundSidebarProps {
  history: GuestHistoryEntry[];
  onNewRequest: () => void;
  onLoadRequest: (entry: GuestHistoryEntry) => void;
  onClearHistory: () => void;
  onDeleteHistoryEntry: (id: string) => void;
}

export function PlaygroundSidebar({
  history,
  onNewRequest,
  onLoadRequest,
  onClearHistory,
  onDeleteHistoryEntry,
}: PlaygroundSidebarProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const {
    environments,
    activeEnvironment,
    isManagerOpen,
    setActiveEnvironment,
    openManager,
    closeManager,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    saveVariables,
  } = usePlaygroundEnvironment();

  const handleDeleteHistory = (id: string) => {
    onDeleteHistoryEntry(id);
  };

  return (
    <aside className="w-64 bg-bg-secondary border-r border-bg-tertiary h-[calc(100vh-48px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-bg-tertiary flex-shrink-0">
        <Button
          onClick={onNewRequest}
          variant="primary"
          size="sm"
          className="w-full"
        >
          New Request
        </Button>
      </div>

      {/* Environment Section */}
      <div className="p-4 border-b border-bg-tertiary flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Environment
          </h3>
          <button
            onClick={openManager}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            ⚙
          </button>
        </div>
        <EnvironmentSelector
          environments={environments}
          activeEnvironment={activeEnvironment}
          onSelect={(id) => setActiveEnvironment(id)}
          onManage={openManager}
        />
      </div>

      {/* History Section */}
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="p-4 border-b border-bg-tertiary flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              History
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="text-xs text-danger hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {showConfirmClear && (
            <div className="p-2 bg-danger/10 border border-danger rounded text-xs space-y-2 mb-2">
              <p className="text-danger">Clear all history?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-2 py-1 bg-bg-tertiary text-text-primary rounded hover:bg-bg-secondary transition-colors text-xs"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmClear(false);
                  }}
                  className="flex-1 px-2 py-1 bg-danger text-white rounded hover:bg-red-600 transition-colors text-xs"
                >
                  Yes
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {history.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">
              No history yet. Make a request to get started!
            </p>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onLoadRequest(entry)}
                className="w-full text-left p-2 rounded hover:bg-bg-tertiary transition-colors group relative"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-success text-white flex-shrink-0">
                    {entry.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate font-mono">
                      {truncateUrl(entry.url, 25)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatTimeAgo(entry.createdAt)}
                    </p>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(entry.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        handleDeleteHistory(entry.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger text-xs flex-shrink-0 cursor-pointer"
                  >
                    ✕
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Guest Banner */}
      <div className="flex-shrink-0">
        <GuestBanner />
      </div>

      {/* Environment Manager Modal */}
      <EnvironmentManager
        isOpen={isManagerOpen}
        onClose={closeManager}
        environments={environments}
        activeEnvironmentId={activeEnvironment?.id || null}
        onSelectEnvironment={(id) => setActiveEnvironment(id)}
        onCreateEnvironment={async (name) => {
          return createEnvironment(name);
        }}
        onUpdateEnvironment={async (id, name) => {
          updateEnvironment(id, name);
        }}
        onDeleteEnvironment={async (id) => {
          deleteEnvironment(id);
        }}
        onSaveVariables={async (envId, variables) => {
          saveVariables(envId, variables);
        }}
      />
    </aside>
  );
}
