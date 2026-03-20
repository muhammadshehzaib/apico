'use client';

import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RequestPage() {
  return (
    <ErrorBoundary>
      <RequestBuilder />
    </ErrorBoundary>
  );
}
