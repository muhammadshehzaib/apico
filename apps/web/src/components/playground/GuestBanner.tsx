'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function GuestBanner() {
  return (
    <div className="m-4 p-4 bg-bg-primary/80 border border-stroke rounded-xl">
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Save your work
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Create a free account to save requests, share links, and more.
      </p>

      <Link href="/register" className="block mb-2">
        <Button variant="primary" size="md" className="w-full">
          Sign up free →
        </Button>
      </Link>

      <div className="text-center">
        <span className="text-xs text-text-muted">Already have an account? </span>
        <Link
          href="/login"
          className="text-xs text-accent hover:text-accentSoft transition-colors font-medium"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
