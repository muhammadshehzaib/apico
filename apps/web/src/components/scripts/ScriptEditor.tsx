'use client';

import { useState, useRef, useEffect } from 'react';

interface ScriptEditorProps {
  script: string;
  onChange: (script: string) => void;
  eventName?: 'Pre-request' | 'Post-response';
}

const EXAMPLES = [
  {
    title: 'Add timestamp header',
    code: `pm.request.headers.add({
  key: 'X-Timestamp',
  value: Date.now().toString()
})`,
  },
  {
    title: 'Add request ID',
    code: `pm.request.headers.add({
  key: 'X-Request-ID',
  value: Math.random().toString(36).substring(2)
})`,
  },
  {
    title: 'Add Bearer token',
    code: `const token = pm.variables.get('TOKEN')
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + token
})`,
  },
  {
    title: 'Log request info',
    code: `console.log('URL:', pm.request.url)
console.log('Method:', pm.request.method)`,
  },
  {
    title: 'Set dynamic variable',
    code: `pm.variables.set('timestamp', Date.now().toString())
// Use {{timestamp}} in your request`,
  },
];

export function ScriptEditor({
  script,
  onChange,
  eventName = 'Pre-request',
}: ScriptEditorProps) {
  const [showDocs, setShowDocs] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newScript = script.substring(0, start) + '  ' + script.substring(end);
      onChange(newScript);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineCount = script.split('\n').length;

  return (
    <div className="flex flex-col h-full border-b border-bg-tertiary">
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary bg-bg-secondary">
        <span className="text-sm font-medium text-text-primary">
          {eventName} Script
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            title="Show documentation"
          >
            ? Docs
          </button>
        </div>
      </div>

      {showDocs && (
        <div className="bg-blue-900 bg-opacity-20 border-b border-blue-700 border-opacity-30 p-3">
          <div className="text-xs text-text-primary space-y-2 max-h-40 overflow-y-auto">
            <div className="font-semibold text-blue-400">Available API:</div>
            <div className="space-y-1 font-mono text-xs">
              <div>pm.request.url - read/write</div>
              <div>pm.request.method - read-only</div>
              <div>pm.request.body - read/write</div>
              <div>pm.request.headers.add(&#123;key, value&#125;)</div>
              <div>pm.request.headers.get(key)</div>
              <div>pm.request.headers.remove(key)</div>
              <div>pm.request.params.add(&#123;key, value&#125;)</div>
              <div>pm.variables.set(key, value)</div>
              <div>pm.variables.get(key)</div>
              <div>pm.environment.get(key)</div>
              <div>console.log(), .warn(), .error()</div>
            </div>

            <div className="mt-3 pt-2 border-t border-text-muted border-opacity-20">
              <div className="font-semibold text-blue-400 mb-2">Examples:</div>
              <div className="space-y-2">
                {EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onChange(example.code);
                      setShowDocs(false);
                    }}
                    className="block w-full text-left px-2 py-1 rounded text-xs bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                  >
                    {example.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="w-9 bg-bg-primary border-r border-bg-tertiary text-text-muted text-xs font-mono p-2 text-right overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-6 leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="// Pre-request script runs before each request is sent&#10;// Use pm object to modify the request&#10;&#10;pm.request.headers.add({&#10;  key: 'X-Timestamp',&#10;  value: Date.now().toString()&#10;})"
          className="flex-1 bg-bg-primary text-text-primary font-mono text-sm resize-none p-3 focus:outline-none placeholder:text-text-muted"
          spellCheck="false"
          style={{
            lineHeight: '1.6',
            tabSize: 2,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
      </div>
    </div>
  );
}
