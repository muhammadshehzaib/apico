'use client';

import { getStatusCodeColor, getStatusCodeText } from '@/utils/format.util';

interface StatusBadgeProps {
  statusCode: number;
}

export function StatusBadge({ statusCode }: StatusBadgeProps) {
  const color = getStatusCodeColor(statusCode);
  const text = getStatusCodeText(statusCode);

  return (
    <div
      style={{ backgroundColor: color }}
      className="inline-flex items-center px-3 py-1.5 rounded text-white text-sm font-mono font-semibold"
    >
      {statusCode} {text}
    </div>
  );
}
