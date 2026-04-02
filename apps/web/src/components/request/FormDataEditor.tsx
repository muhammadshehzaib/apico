'use client';

import { FormDataField } from '@/types';

interface FormDataEditorProps {
  fields: FormDataField[];
  onChange: (fields: FormDataField[]) => void;
  files: Map<string, File>;
  onFilesChange: (files: Map<string, File>) => void;
}

export function FormDataEditor({
  fields,
  onChange,
  files,
  onFilesChange,
}: FormDataEditorProps) {
  const handleToggle = (index: number) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onChange(updated);
  };

  const handleKeyChange = (index: number, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], key: value };
    onChange(updated);
  };

  const handleTypeChange = (index: number, type: 'text' | 'file') => {
    const updated = [...fields];
    const oldField = updated[index];
    updated[index] = { ...oldField, type, value: '', fileName: undefined };
    onChange(updated);

    // Remove any existing file for this row
    const rowKey = String(index);
    if (files.has(rowKey)) {
      const newFiles = new Map(files);
      newFiles.delete(rowKey);
      onFilesChange(newFiles);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], value };
    onChange(updated);
  };

  const handleFileSelect = (index: number, file: File | null) => {
    const newFiles = new Map(files);
    const rowKey = String(index);

    if (file) {
      newFiles.set(rowKey, file);
      const updated = [...fields];
      updated[index] = { ...updated[index], fileName: file.name };
      onChange(updated);
    } else {
      newFiles.delete(rowKey);
      const updated = [...fields];
      updated[index] = { ...updated[index], fileName: undefined };
      onChange(updated);
    }

    onFilesChange(newFiles);
  };

  const handleDelete = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    onChange(updated);

    // Rebuild files map with shifted indices
    const newFiles = new Map<string, File>();
    files.forEach((file, key) => {
      const oldIndex = parseInt(key);
      if (oldIndex < index) {
        newFiles.set(key, file);
      } else if (oldIndex > index) {
        newFiles.set(String(oldIndex - 1), file);
      }
    });
    onFilesChange(newFiles);
  };

  const handleAddRow = () => {
    onChange([...fields, { key: '', type: 'text', value: '', enabled: true }]);
  };

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="space-y-2 flex-1 overflow-auto min-h-0 pr-1">
        {fields.map((field, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 bg-bg-primary/80 border border-stroke rounded-md transition-opacity ${
              !field.enabled ? 'opacity-40' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={field.enabled}
              onChange={() => handleToggle(index)}
              className="w-4 h-4 cursor-pointer flex-shrink-0"
            />

            <input
              type="text"
              value={field.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder="Key"
              className="flex-1 min-w-0 px-3 py-1.5 bg-bg-secondary/80 border border-stroke rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
            />

            <select
              value={field.type}
              onChange={(e) =>
                handleTypeChange(index, e.target.value as 'text' | 'file')
              }
              className="px-2 py-1.5 bg-bg-secondary/80 border border-stroke rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer flex-shrink-0"
            >
              <option value="text">Text</option>
              <option value="file">File</option>
            </select>

            {field.type === 'text' ? (
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                placeholder="Value"
                className="flex-1 min-w-0 px-3 py-1.5 bg-bg-secondary/80 border border-stroke rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
              />
            ) : (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <label className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/80 border border-stroke rounded-md text-sm cursor-pointer hover:border-accent/40 transition-colors">
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileSelect(index, e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                  {files.has(String(index)) ? (
                    <span className="text-text-primary truncate">
                      {files.get(String(index))!.name}
                    </span>
                  ) : field.fileName ? (
                    <span className="text-text-muted truncate">
                      {field.fileName} (re-attach)
                    </span>
                  ) : (
                    <span className="text-text-muted">Choose file</span>
                  )}
                </label>
                {(files.has(String(index)) || field.fileName) && (
                  <button
                    onClick={() => handleFileSelect(index, null)}
                    className="text-text-muted hover:text-danger text-xs flex-shrink-0"
                    title="Remove file"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => handleDelete(index)}
              className="px-2 py-1.5 text-text-muted hover:text-danger transition-colors font-bold flex-shrink-0"
              title="Delete row"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddRow}
        className="px-4 py-2 text-accent hover:text-accentSoft text-sm font-medium transition-colors flex-shrink-0 w-fit"
      >
        + Add row
      </button>
    </div>
  );
}
