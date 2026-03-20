'use client';

import { useState } from 'react';
import { EnvironmentVariable } from '@/services/environment.service';
import { Button } from '@/components/ui/Button';

interface VariableEditorProps {
  variables: EnvironmentVariable[];
  onChange: (variables: EnvironmentVariable[]) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

export function VariableEditor({
  variables,
  onChange,
  onSave,
  isSaving = false,
}: VariableEditorProps) {
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  const toggleSecretVisibility = (index: number) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleToggle = (index: number) => {
    const newVars = [...variables];
    newVars[index].enabled = !newVars[index].enabled;
    onChange(newVars);
  };

  const handleKeyChange = (index: number, value: string) => {
    const newVars = [...variables];
    newVars[index].key = value;
    onChange(newVars);
  };

  const handleValueChange = (index: number, value: string) => {
    const newVars = [...variables];
    newVars[index].value = value;
    onChange(newVars);
  };

  const handleSecretToggle = (index: number) => {
    const newVars = [...variables];
    newVars[index].isSecret = !newVars[index].isSecret;
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    onChange(newVars);
  };

  const handleDelete = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    onChange([
      ...variables,
      { key: '', value: '', enabled: true, isSecret: false },
    ]);
  };

  const handleSave = async () => {
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save variables:', error);
    }
  };

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-text-muted mb-4">No variables yet</p>
        <p className="text-sm text-text-muted mb-6">Add variables to use in your requests</p>
        <Button onClick={handleAddRow} variant="primary" size="sm">
          + Add Variable
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Header row */}
        <div className="grid grid-cols-[30px_1fr_1.5fr_60px_30px] gap-2 px-2 py-1 text-xs font-semibold text-text-muted mb-2">
          <div>✓</div>
          <div>Variable</div>
          <div>Value</div>
          <div>Secret</div>
          <div></div>
        </div>

        {/* Variable rows */}
        {variables.map((variable, index) => (
          <div
            key={index}
            className={`grid grid-cols-[30px_1fr_1.5fr_60px_30px] gap-2 p-2 bg-bg-primary rounded transition-opacity ${
              !variable.enabled ? 'opacity-40' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={variable.enabled}
              onChange={() => handleToggle(index)}
              className="w-4 h-4 cursor-pointer"
            />

            <input
              type="text"
              value={variable.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder="Variable name"
              className="px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-sm font-mono focus:outline-none focus:border-accent"
            />

            <input
              type={variable.isSecret && !visibleSecrets.has(index) ? 'password' : 'text'}
              value={variable.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder="Value"
              className="px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-sm font-mono focus:outline-none focus:border-accent"
            />

            <button
              onClick={() => handleSecretToggle(index)}
              className={`px-2 py-2 rounded text-sm transition-colors ${
                variable.isSecret
                  ? 'bg-warning/20 text-warning'
                  : 'bg-bg-secondary text-text-muted hover:text-text-primary'
              }`}
              title={variable.isSecret ? 'Marked as secret' : 'Mark as secret'}
            >
              {variable.isSecret ? '👁' : '○'}
            </button>

            <button
              onClick={() => handleDelete(index)}
              className="text-text-muted hover:text-danger transition-colors font-bold"
              title="Delete variable"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddRow}
        className="px-4 py-2 text-accent hover:text-blue-400 text-sm font-medium transition-colors"
      >
        + Add Variable
      </button>

      <div className="flex gap-3 pt-4 border-t border-bg-tertiary">
        <Button
          onClick={handleSave}
          variant="primary"
          size="md"
          isLoading={isSaving}
          className="flex-1"
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
