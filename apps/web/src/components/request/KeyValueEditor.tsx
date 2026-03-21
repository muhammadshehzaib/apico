'use client';

import { KeyValuePair } from '@/types';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  placeholder?: { key: string; value: string };
}

export function KeyValueEditor({
  pairs,
  onChange,
  placeholder = { key: 'Key', value: 'Value' },
}: KeyValueEditorProps) {
  const handleToggle = (index: number) => {
    const newPairs = [...pairs];
    newPairs[index].enabled = !newPairs[index].enabled;
    onChange(newPairs);
  };

  const handleKeyChange = (index: number, value: string) => {
    const newPairs = [...pairs];
    newPairs[index].key = value;
    onChange(newPairs);
  };

  const handleValueChange = (index: number, value: string) => {
    const newPairs = [...pairs];
    newPairs[index].value = value;
    onChange(newPairs);
  };

  const handleDelete = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    onChange(newPairs);
  };

  const handleAddRow = () => {
    onChange([...pairs, { key: '', value: '', enabled: true }]);
  };

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="space-y-2 flex-1 overflow-auto min-h-0 pr-1">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 bg-bg-primary rounded transition-opacity ${!pair.enabled ? 'opacity-40' : ''
              }`}
          >
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={() => handleToggle(index)}
              className="w-4 h-4 cursor-pointer"
            />

            <input
              type="text"
              value={pair.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder={placeholder.key}
              className="flex-1 px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded text-sm focus:outline-none focus:border-accent"
            />

            <input
              type="text"
              value={pair.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder={placeholder.value}
              className="flex-1 px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded text-sm focus:outline-none focus:border-accent"
            />

            <button
              onClick={() => handleDelete(index)}
              className="px-2 py-1.5 text-text-muted hover:text-danger transition-colors font-bold"
              title="Delete row"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddRow}
        className="px-4 py-2 text-accent hover:text-blue-400 text-sm font-medium transition-colors flex-shrink-0 w-fit"
      >
        + Add row
      </button>
    </div>
  );
}
