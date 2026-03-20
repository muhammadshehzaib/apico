'use client';

import type { TestResult } from '@/utils/sandbox/pm.context';

interface TestResultItemProps {
  result: TestResult;
}

export function TestResultItem({ result }: TestResultItemProps) {
  return (
    <div
      className={`px-3 py-2 border-l-2 transition-colors hover:bg-bg-tertiary ${
        result.passed
          ? 'border-green-500 border-opacity-30'
          : 'border-red-500 border-opacity-30'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`flex-shrink-0 font-bold ${
              result.passed ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.passed ? '✓' : '✕'}
          </span>
          <span className="text-text-primary text-sm truncate">{result.name}</span>
        </div>
        <span className="text-text-muted text-xs flex-shrink-0">{result.duration}ms</span>
      </div>

      {!result.passed && result.error && (
        <div className="mt-1 ml-6 text-red-400 text-xs font-mono">{result.error}</div>
      )}
    </div>
  );
}
