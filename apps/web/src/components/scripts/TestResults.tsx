'use client';

import { useState } from 'react';
import { TestResultItem } from './TestResultItem';
import { ScriptConsole } from './ScriptConsole';
import type { TestResult, ConsoleLine } from '@/utils/sandbox/pm.context';

interface TestResultsProps {
  results: TestResult[];
  testsPassed: number;
  testsFailed: number;
  isRunning: boolean;
  error: string | null;
  consoleLogs: ConsoleLine[];
  lastRunDuration: number | null;
  onClear: () => void;
}

export function TestResults({
  results,
  testsPassed,
  testsFailed,
  isRunning,
  error,
  consoleLogs,
  lastRunDuration,
  onClear,
}: TestResultsProps) {
  const [showConsole, setShowConsole] = useState(false);
  const totalTests = testsPassed + testsFailed;
  const allPassed = totalTests > 0 && testsFailed === 0;
  const allFailed = totalTests > 0 && testsPassed === 0;

  const progressPercent = totalTests > 0 ? (testsPassed / totalTests) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary bg-bg-secondary">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Test Results</span>
          {isRunning ? (
            <span className="text-xs px-2 py-1 rounded bg-yellow-900 bg-opacity-30 text-yellow-400">
              Running tests...
            </span>
          ) : totalTests > 0 ? (
            <>
              {testsPassed > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-green-900 bg-opacity-30 text-green-400">
                  ✓ {testsPassed} passed
                </span>
              )}
              {testsFailed > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-red-900 bg-opacity-30 text-red-400">
                  ✕ {testsFailed} failed
                </span>
              )}
            </>
          ) : null}
          {lastRunDuration !== null && (
            <span className="text-xs text-text-muted">ran in {lastRunDuration}ms</span>
          )}
        </div>

        <button
          onClick={onClear}
          className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
          title="Clear results"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      {totalTests > 0 && (
        <div className="h-1 bg-bg-tertiary">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {isRunning ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <div className="text-sm">Running tests...</div>
            </div>
          </div>
        ) : totalTests === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <div className="text-sm">No tests run yet</div>
              <div className="text-xs mt-1">Write test scripts in the Scripts tab</div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary message */}
            <div className="px-4 py-3 border-b border-bg-tertiary">
              {allPassed ? (
                <div className="text-green-400 text-sm font-medium">
                  ✓ All {totalTests} tests passed!
                </div>
              ) : allFailed ? (
                <div className="text-red-400 text-sm font-medium">
                  ✕ All {totalTests} tests failed
                </div>
              ) : (
                <div className="text-text-primary text-sm font-medium">
                  {testsPassed} passed, {testsFailed} failed
                </div>
              )}
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-auto space-y-0">
              {results.map((result, idx) => (
                <TestResultItem key={idx} result={result} />
              ))}
            </div>

            {/* Console section */}
            <div className="border-t border-bg-tertiary">
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="w-full px-4 py-2 text-left text-sm font-medium text-text-muted hover:text-text-primary transition-colors border-b border-bg-tertiary"
              >
                Console {consoleLogs.length > 0 && `(${consoleLogs.length})`}
              </button>

              {showConsole && (
                <div className="border-t border-bg-tertiary">
                  <ScriptConsole
                    logs={consoleLogs}
                    error={error}
                    isRunning={false}
                    lastRunDuration={null}
                    onClear={onClear}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
