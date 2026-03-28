'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { workspaceService } from '@/services/workspace.service';
import { SharedCollection, SavedRequest } from '@/types';
import { APP_NAME, HTTP_METHOD_TAILWIND } from '@/constants/app.constants';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'apico_last_request';

export default function ShareCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = (params?.token as string) || '';

  useEffect(() => {
    const load = async () => {
      try {
        if (!token) {
          setError('Shared collection not found');
          return;
        }
        const data = await workspaceService.getSharedCollection(token);
        if (!data) {
          setError('Shared collection not found');
          return;
        }
        setCollection(data);
      } catch {
        setError('Failed to load shared collection');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const openRequest = (request: SavedRequest) => {
    try {
      const toSave = {
        method: request.method,
        url: request.url,
        headers: request.headers || [{ key: '', value: '', enabled: true }],
        params: request.params || [{ key: '', value: '', enabled: true }],
        body: request.body || '',
        auth: request.auth || { type: 'none' },
        activeTab: 'params',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore; still navigate
    }
    router.push('/request');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{APP_NAME}</h1>
            <p className="text-text-muted text-sm">Shared Collection</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push('/request')}>
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-text-muted">Loading...</div>
        ) : error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : collection ? (
          <div className="space-y-4">
            <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
              <div className="text-lg font-semibold text-text-primary">
                {collection.name}
              </div>
              <div className="text-xs text-text-muted">
                {collection.requests.length} requests
              </div>
            </div>

            {collection.requests.length === 0 ? (
              <div className="text-sm text-text-muted">No requests in this collection.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collection.requests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => openRequest(request)}
                    className="text-left bg-bg-secondary border border-bg-tertiary rounded-lg p-4 hover:border-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`${HTTP_METHOD_TAILWIND[request.method]} text-white text-xs font-bold px-2 py-0.5 rounded`}
                      >
                        {request.method}
                      </span>
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {request.name}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs break-all">{request.url}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
