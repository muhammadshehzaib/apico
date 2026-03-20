'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function PlaygroundHeader() {
  return (
    <header className="sticky top-0 z-40 bg-bg-secondary border-b border-bg-tertiary">
      <div className="h-12 px-6 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-accent">⚡ Apico</span>
          <span className="text-sm text-text-muted">Playground</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="md">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="md">
              Sign up free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
