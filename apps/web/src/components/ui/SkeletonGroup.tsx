import React from 'react';
import { Skeleton } from './Skeleton';

interface SkeletonGroupProps {
  type:
    | 'page-header'
    | 'list-item'
    | 'card'
    | 'response-panel'
    | 'collection-item'
    | 'full-page';
  count?: number;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  type,
  count = 1,
}) => {
  switch (type) {
    case 'page-header':
      return (
        <div className="space-y-4">
          <Skeleton height={32} className="w-1/3" />
          <Skeleton height={16} className="w-1/4" />
        </div>
      );

    case 'list-item':
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg">
              <Skeleton width={24} height={24} className="flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} className="w-1/2" />
                <Skeleton height={12} className="w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-6 bg-bg-secondary border border-bg-tertiary rounded-lg space-y-3">
              <Skeleton height={20} className="w-2/3" />
              <Skeleton height={14} className="w-1/2" />
              <Skeleton height={14} className="w-3/4" />
            </div>
          ))}
        </div>
      );

    case 'response-panel':
      return (
        <div className="h-full flex flex-col">
          <div className="border-b border-bg-tertiary px-4 py-3 bg-bg-secondary space-y-3">
            <div className="flex items-center gap-6">
              <Skeleton width={60} height={20} />
              <Skeleton width={80} height={16} />
              <Skeleton width={100} height={16} />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            <Skeleton height={16} className="w-3/4" />
            <Skeleton height={16} className="w-full" />
            <Skeleton height={16} className="w-2/3" />
            <Skeleton height={16} className="w-full" />
            <Skeleton height={16} className="w-1/2" />
          </div>
        </div>
      );

    case 'collection-item':
      return (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 h-8 px-2">
              <Skeleton width={16} height={16} className="flex-shrink-0" />
              <Skeleton height={14} className="flex-1 w-1/2" />
              <Skeleton width={24} height={16} className="flex-shrink-0" />
            </div>
          ))}
        </div>
      );

    case 'full-page':
      return (
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <Skeleton height={32} className="w-1/4" />
            <Skeleton height={16} className="w-1/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 bg-bg-secondary border border-bg-tertiary rounded-lg space-y-3">
                <Skeleton height={24} className="w-2/3" />
                <Skeleton height={14} className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

SkeletonGroup.displayName = 'SkeletonGroup';
