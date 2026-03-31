'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function PlaygroundHeader() {
  return (
    <header className="sticky top-0 z-40 bg-bg-secondary/90 border-b border-bg-tertiary/60 backdrop-blur">
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-text-muted">Apico</div>
            <div className="text-base font-semibold text-text-primary">Playground</div>
          </div>
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
