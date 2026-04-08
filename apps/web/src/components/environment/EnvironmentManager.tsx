'use client';

import { useRef, useState, useEffect } from 'react';
import { Environment, EnvironmentVariable } from '@/services/environment.service';
import { EnvironmentModal } from './EnvironmentModal';
import { VariableEditor } from './VariableEditor';
import { Button } from '@/components/ui/Button';
import type { GuestEnvironment } from '@/utils/playground.storage';

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  environments: (Environment | GuestEnvironment)[];
  activeEnvironmentId: string | null;
  onSelectEnvironment: (id: string) => void;
  onCreateEnvironment: (name: string) => Promise<{ id: string }> | { id: string };
  onUpdateEnvironment: (id: string, name: string) => Promise<void> | void;
  onDeleteEnvironment: (id: string) => Promise<void>;
  onSaveVariables: (environmentId: string, variables: EnvironmentVariable[]) => Promise<void>;
}

export function EnvironmentManager({
  isOpen,
  onClose,
  environments,
  activeEnvironmentId,
  onSelectEnvironment,
  onCreateEnvironment,
  onUpdateEnvironment,
  onDeleteEnvironment,
  onSaveVariables,
}: EnvironmentManagerProps) {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(activeEnvironmentId);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingVars, setIsSavingVars] = useState(false);
  const [editingVariables, setEditingVariables] = useState<EnvironmentVariable[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  useEffect(() => {
    if (isOpen && selectedEnv) {
      const vars = Array.isArray(selectedEnv.variables) ? selectedEnv.variables : [];
      setEditingVariables([...vars]);
    }
  }, [isOpen, selectedEnv]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCreateEnvironment = async (name: string) => {
    setIsCreating(true);
    try {
      const env = await onCreateEnvironment(name);
      setSelectedEnvId(env.id);
      onSelectEnvironment(env.id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameEnvironment = async (id: string, newName: string) => {
    setIsRenaming(true);
    try {
      await onUpdateEnvironment(id, newName);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteEnvironment = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDeleteEnvironment(id);
      if (selectedEnvId === id) {
        const nextEnv = environments.find((e) => e.id !== id);
        if (nextEnv) {
          setSelectedEnvId(nextEnv.id);
          onSelectEnvironment(nextEnv.id);
        } else {
          setSelectedEnvId(null);
        }
      }
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveVariables = async () => {
    if (!selectedEnvId) return;
    setIsSavingVars(true);
    try {
      await onSaveVariables(selectedEnvId, editingVariables);
    } finally {
      setIsSavingVars(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-bg-secondary/95 border-l border-stroke z-50 flex flex-col overflow-hidden transform transition-transform duration-300 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary/60 flex-shrink-0">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Environment</div>
            <h2 className="text-xl font-semibold text-text-primary mt-1">Environments</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-2xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Environment list (left) */}
          <div className="w-52 bg-bg-primary/80 border-r border-bg-tertiary/60 overflow-auto p-4 space-y-2">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.2em] mb-3">
              Your Environments
            </h3>

            {environments.map((env) => (
              <div
                key={env.id}
                className={`p-2 rounded-md transition-colors group border ${selectedEnvId === env.id
                  ? 'bg-bg-secondary/80 border-accent/50'
                  : 'border-transparent hover:bg-bg-secondary/70 hover:border-stroke/60'
                  }`}
              >
                <button
                  onClick={() => {
                    setSelectedEnvId(env.id);
                    onSelectEnvironment(env.id);
                    setDeleteConfirm(null);
                  }}
                  className="w-full text-left text-sm font-medium text-text-primary mb-1"
                >
                  {env.name}
                </button>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setRenameTarget({ id: env.id, name: env.name });
                      setRenameModalOpen(true);
                    }}
                    className="text-xs px-2 py-1 bg-bg-tertiary/70 text-text-muted hover:text-text-primary rounded-md transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(env.id)}
                    className="text-xs px-2 py-1 bg-danger/20 text-danger hover:bg-danger/30 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {deleteConfirm === env.id && (
                  <div className="mt-2 p-2 bg-danger/10 border border-danger/60 rounded-md text-xs space-y-2">
                    <p className="text-danger">Delete "{env.name}"?</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 px-2 py-1 bg-bg-tertiary/70 text-text-primary rounded-md hover:bg-bg-tertiary transition-colors"
                      >
                        No
                      </button>
                      <button
                        onClick={() => handleDeleteEnvironment(env.id)}
                        className="flex-1 px-2 py-1 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors"
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button
              onClick={() => setNewModalOpen(true)}
              variant="secondary"
              size="sm"
              className="w-full mt-4"
            >
              + New Environment
            </Button>
          </div>

          {/* Variable editor (right) */}
          <div className="flex-1 overflow-auto bg-bg-primary/80 p-6">
            {selectedEnv ? (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {selectedEnv.name} Variables
                </h3>
                <VariableEditor
                  variables={editingVariables}
                  onChange={setEditingVariables}
                  onSave={handleSaveVariables}
                  isSaving={isSavingVars}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-text-muted">Select an environment to manage variables</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EnvironmentModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onConfirm={handleCreateEnvironment}
        title="New Environment"
        confirmLabel="Create"
        isLoading={isCreating}
      />

      <EnvironmentModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onConfirm={(newName) =>
          handleRenameEnvironment(renameTarget!.id, newName)
        }
        title="Rename Environment"
        initialValue={renameTarget?.name}
        confirmLabel="Rename"
        isLoading={isRenaming}
      />
    </>
  );
}
