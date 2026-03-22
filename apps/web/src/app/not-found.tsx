import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl font-bold text-accent">404</div>
        <h1 className="text-3xl font-bold text-text-primary">Page Not Found</h1>
        <p className="text-text-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/workspace">
          <Button variant="primary" size="md" className="w-full">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
