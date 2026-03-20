'use client';

import { ExecuteRequestResult } from '@/types';
import { StatusBadge } from './StatusBadge';
import { ResponseViewer } from './ResponseViewer';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { formatDuration, formatBytes } from '@/utils/format.util';

interface ResponsePanelProps {
  response: ExecuteRequestResult | null;
  isLoading: boolean;
  error: string | null;
}

export function ResponsePanel({ response, isLoading, error }: ResponsePanelProps) {
  if (isLoading) {
    return (
      <div className="h-full bg-bg-primary">
        <SkeletonGroup type="response-panel" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary p-4">
        <div className="bg-danger/10 border border-danger text-danger px-6 py-4 rounded max-w-md text-center">
          <p className="font-medium mb-2">Request Failed</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary">
        <p className="text-text-muted text-center">Send a request to see the response</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <div className="border-b border-bg-tertiary px-4 py-3 bg-bg-secondary flex items-center gap-6">
        <StatusBadge statusCode={response.statusCode} />
        <span className="text-text-muted text-sm font-mono">
          {formatDuration(response.duration)}
        </span>
        <span className="text-text-muted text-sm font-mono">
          {formatBytes(response.size)}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <ResponseViewer body={response.body} headers={response.headers} />
      </div>
    </div>
  );
}
