'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceService } from '@/services/workspace.service';
import { SavedRequest } from '@/types';
import { HTTP_METHOD_TAILWIND, APP_NAME } from '@/constants/app.constants';
import { Button } from '@/components/ui/Button';

interface SharePageProps {
  params: { token: string };
}

export default function SharePage({ params }: SharePageProps) {
  const router = useRouter();
  const [request, setRequest] = useState<SavedRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await workspaceService.getSharedRequest(params.token);
        if (!data) {
          setError('Shared request not found');
          return;
        }
        setRequest(data);
      } catch {
        setError('Failed to load shared request');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.token]);

  const handleOpenInBuilder = () => {
    if (!request) return;
    const payload = {
      method: request.method,
      url: request.url,
      headers: request.headers || [],
      params: request.params || [],
      body: request.body || '',
      auth: request.auth || { type: 'none' },
    };
    localStorage.setItem('apico_last_request', JSON.stringify(payload));
    router.push('/request');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-bg-secondary border border-bg-tertiary rounded-xl shadow-glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">{APP_NAME}</h1>
          <span className="text-xs text-text-muted">Shared Request</span>
        </div>

        {isLoading ? (
          <div className="text-sm text-text-muted">Loading...</div>
        ) : error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : request ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`${HTTP_METHOD_TAILWIND[request.method]} text-white text-xs font-bold px-2 py-1 rounded`}
              >
                {request.method}
              </span>
              <span className="text-sm font-mono text-text-primary truncate">
                {request.url}
              </span>
            </div>

            <div className="text-xs text-text-muted">
              {request.name}
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleOpenInBuilder}>
                Open In Request Builder
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/request')}>
                New Request
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
