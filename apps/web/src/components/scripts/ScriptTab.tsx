'use client';

import { useState } from 'react';
import { ScriptEditor } from './ScriptEditor';
import { ScriptConsole } from './ScriptConsole';
import { TestResults } from './TestResults';
import type { ConsoleLine, TestResult } from '@/utils/sandbox/pm.context';

interface ScriptTabProps {
  preRequestScript: string;
  onPreRequestChange: (script: string) => void;
  consoleLogs: ConsoleLine[];
  scriptError: string | null;
  isScriptRunning: boolean;
  lastRunDuration: number | null;
  onClearLogs: () => void;
  postResponseScript?: string;
  onPostResponseChange?: (script: string) => void;
  testResults?: TestResult[];
  testsPassed?: number;
  testsFailed?: number;
  isTestRunning?: boolean;
  testError?: string | null;
  testConsoleLogs?: ConsoleLine[];
  lastTestRunDuration?: number | null;
  onClearTestResults?: () => void;
}

export function ScriptTab({
  preRequestScript,
  onPreRequestChange,
  consoleLogs,
  scriptError,
  isScriptRunning,
  lastRunDuration,
  onClearLogs,
  postResponseScript = '',
  onPostResponseChange,
  testResults = [],
  testsPassed = 0,
  testsFailed = 0,
  isTestRunning = false,
  testError = null,
  testConsoleLogs = [],
  lastTestRunDuration = null,
  onClearTestResults,
}: ScriptTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pre-request' | 'tests'>('pre-request');
  const [editorHeight, setEditorHeight] = useState(60); // percentage
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain between 20% and 80%
    if (newHeight > 20 && newHeight < 80) {
      setEditorHeight(newHeight);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Sub-tabs */}
      <div className="flex border-b border-bg-tertiary bg-bg-secondary">
        <button
          onClick={() => setActiveSubTab('pre-request')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'pre-request'
              ? 'text-text-primary border-accent'
              : 'text-text-muted border-transparent hover:text-text-primary'
          }`}
        >
          Pre-request Script
        </button>

        <button
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
            activeSubTab === 'tests'
              ? 'text-text-primary border-accent'
              : 'text-text-muted border-transparent hover:text-text-primary'
          }`}
        >
          Tests
          {testsPassed > 0 && (
            <span className="ml-2 inline-block text-xs px-1.5 py-0.5 rounded bg-green-900 bg-opacity-30 text-green-400">
              ✓{testsPassed}
            </span>
          )}
          {testsFailed > 0 && (
            <span className="ml-1 inline-block text-xs px-1.5 py-0.5 rounded bg-red-900 bg-opacity-30 text-red-400">
              ✕{testsFailed}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'pre-request' ? (
        <div
          className="flex flex-col h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Editor */}
          <div style={{ height: `${editorHeight}%` }} className="overflow-hidden">
            <ScriptEditor
              script={preRequestScript}
              onChange={onPreRequestChange}
              eventName="Pre-request"
            />
          </div>

          {/* Divider */}
          <div
            onMouseDown={handleMouseDown}
            className={`h-1 bg-bg-tertiary hover:bg-accent transition-colors cursor-ns-resize ${
              isDragging ? 'bg-accent' : ''
            }`}
          />

          {/* Console */}
          <div style={{ height: `${100 - editorHeight}%` }} className="overflow-hidden">
            <ScriptConsole
              logs={consoleLogs}
              error={scriptError}
              isRunning={isScriptRunning}
              lastRunDuration={lastRunDuration}
              onClear={onClearLogs}
            />
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Test Editor */}
          <div style={{ height: `${editorHeight}%` }} className="overflow-hidden">
            {onPostResponseChange && (
              <ScriptEditor
                script={postResponseScript}
                onChange={onPostResponseChange}
                eventName="Test"
              />
            )}
          </div>

          {/* Divider */}
          <div
            onMouseDown={handleMouseDown}
            className={`h-1 bg-bg-tertiary hover:bg-accent transition-colors cursor-ns-resize ${
              isDragging ? 'bg-accent' : ''
            }`}
          />

          {/* Test Results */}
          <div style={{ height: `${100 - editorHeight}%` }} className="overflow-hidden">
            {onClearTestResults && (
              <TestResults
                results={testResults}
                testsPassed={testsPassed}
                testsFailed={testsFailed}
                isRunning={isTestRunning}
                error={testError}
                consoleLogs={testConsoleLogs}
                lastRunDuration={lastTestRunDuration}
                onClear={onClearTestResults}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
