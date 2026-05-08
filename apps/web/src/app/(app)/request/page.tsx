'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const RequestBuilder = dynamic(
  () => import('@/components/request/RequestBuilder').then((m) => ({ default: m.RequestBuilder })),
  {
    loading: () => <div className="animate-pulse h-full bg-bg-secondary rounded" />,
    ssr: false,
  }
);

export default function RequestPage() {
  return (
    <ErrorBoundary>
      <RequestBuilder />
    </ErrorBoundary>
  );
}
