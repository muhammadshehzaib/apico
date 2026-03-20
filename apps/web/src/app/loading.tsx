import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <Skeleton height={32} className="w-1/4" />
        <Skeleton height={16} className="w-1/6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-bg-secondary border border-bg-tertiary rounded-lg space-y-3">
            <Skeleton height={24} className="w-2/3" />
            <Skeleton height={14} className="w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
