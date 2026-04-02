'use client';

import { useState } from 'react';
import { FormDataEditor } from './FormDataEditor';
import type { BodyType, FormDataField } from '@/types';

interface BodyEditorProps {
  body: string;
  onChange: (body: string) => void;
  bodyType: BodyType;
  onBodyTypeChange: (bodyType: BodyType) => void;
  formDataFields: FormDataField[];
  onFormDataFieldsChange: (fields: FormDataField[]) => void;
  formDataFiles: Map<string, File>;
  onFormDataFilesChange: (files: Map<string, File>) => void;
}

export function BodyEditor({
  body,
  onChange,
  bodyType,
  onBodyTypeChange,
  formDataFields,
  onFormDataFieldsChange,
  formDataFiles,
  onFormDataFilesChange,
}: BodyEditorProps) {
  const [isInvalidJson, setIsInvalidJson] = useState(false);

  const handleChange = (value: string) => {
    onChange(value);
    if (bodyType === 'json') {
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

  const modeButton = (mode: BodyType, label: string) => (
    <button
      onClick={() => onBodyTypeChange(mode)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
        bodyType === mode
          ? 'bg-accent/15 text-accent border-accent/40'
          : 'bg-bg-secondary/80 text-text-muted border-stroke hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="flex gap-2 items-center flex-shrink-0">
        {modeButton('json', 'JSON')}
        {modeButton('raw', 'Raw')}
        {modeButton('form-data', 'Form Data')}

        {bodyType === 'json' && (
          <button
            onClick={handleFormat}
            className="ml-auto px-3 py-1.5 rounded-md text-sm font-medium bg-bg-secondary/80 text-text-muted hover:text-text-primary transition-colors border border-stroke"
          >
            Format
          </button>
        )}
      </div>

      {bodyType === 'form-data' ? (
        <div className="flex-1 min-h-0 -mx-4 -mb-3">
          <FormDataEditor
            fields={formDataFields}
            onChange={onFormDataFieldsChange}
            files={formDataFiles}
            onFilesChange={onFormDataFilesChange}
          />
        </div>
      ) : (
        <>
          <textarea
            value={body}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter request body..."
            className={`w-full p-3 bg-bg-primary/80 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 flex-1 min-h-0 ${
              isInvalidJson ? 'border-danger/80' : 'border-stroke'
            }`}
          />

          {isInvalidJson && (
            <div className="text-danger text-xs">Invalid JSON</div>
          )}
        </>
      )}
    </div>
  );
}
