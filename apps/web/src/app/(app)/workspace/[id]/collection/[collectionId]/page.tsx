'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { workspaceService } from '@/services/workspace.service';
import { Collection, SavedRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { SkeletonGroup } from '@/components/ui/SkeletonGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { setActiveWorkspace } from '@/store/slices/workspace.slice';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const workspaceId = params.id as string;
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dispatch(setActiveWorkspace(workspaceId));
  }, [workspaceId, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionsData, requestsData] = await Promise.all([
          workspaceService.getCollections(workspaceId),
          workspaceService.getSavedRequests(collectionId),
        ]);
        const found = collectionsData.find((c) => c.id === collectionId) || null;
        setCollection(found);
        setRequests(requestsData);
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, collectionId]);

  if (isLoading) {
    return <SkeletonGroup type="full-page" count={3} />;
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-muted">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          <p className="text-text-muted">
            Created on {new Date(collection.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => router.push('/request')}>
          New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="ðŸ“„"
          title="No Requests Yet"
          description="Create your first request and save it to this collection."
          action={{
            label: 'Go to Request Builder',
            onClick: () => router.push('/request'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="block bg-bg-secondary border border-bg-tertiary rounded-lg p-6 hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                  {request.method}
                </span>
                <h3 className="text-lg font-semibold">{request.name}</h3>
              </div>
              <p className="text-text-muted text-sm break-all">{request.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
