'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/constants/app.constants';

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="w-64 bg-bg-secondary/90 border-r border-bg-tertiary/60 h-screen flex flex-col backdrop-blur">
      <div className="p-6 border-b border-bg-tertiary/60">
        <Link href="/workspace" className="inline-block">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent font-bold">
              A
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">
              {APP_NAME}
            </h1>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        <Link
          href="/request"
          className={`block px-4 py-2 rounded-lg transition-all font-semibold border ${isActive('/request')
              ? 'bg-accent/15 border-accent/40 text-text-primary shadow-[0_8px_24px_rgba(58,134,255,0.15)]'
              : 'border-transparent text-text-primary hover:bg-bg-tertiary/60 hover:border-stroke'
            }`}
        >
          + New Request
        </Link>
        <Link
          href="/workspace"
          className={`block px-4 py-2 rounded-lg transition-all border ${isActive('/workspace')
              ? 'bg-accent/15 border-accent/40 text-text-primary'
              : 'border-transparent text-text-primary hover:bg-bg-tertiary/60 hover:border-stroke'
            }`}
        >
          Workspaces
        </Link>
        <Link
          href="/collections"
          className={`block px-4 py-2 rounded-lg transition-all border ${isActive('/collections')
              ? 'bg-accent/15 border-accent/40 text-text-primary'
              : 'border-transparent text-text-primary hover:bg-bg-tertiary/60 hover:border-stroke'
            }`}
        >
          Collections
        </Link>
        <Link
          href="/history"
          className={`block px-4 py-2 rounded-lg transition-all border ${isActive('/history')
              ? 'bg-accent/15 border-accent/40 text-text-primary'
              : 'border-transparent text-text-primary hover:bg-bg-tertiary/60 hover:border-stroke'
            }`}
        >
          History
        </Link>
      </nav>

      <div className="p-6 border-t border-bg-tertiary/60">
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
