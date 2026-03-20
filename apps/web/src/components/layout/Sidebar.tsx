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
    <aside className="w-64 bg-bg-secondary border-r border-bg-tertiary h-screen flex flex-col">
      <div className="p-6 border-b border-bg-tertiary">
        <h1 className="text-xl font-bold text-accent">{APP_NAME}</h1>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        <Link
          href="/app/request"
          className={`block px-4 py-2 rounded transition-colors font-semibold ${
            isActive('/app/request') ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          + New Request
        </Link>
        <Link
          href="/app/workspace"
          className={`block px-4 py-2 rounded transition-colors ${
            isActive('/app/workspace') ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          Workspaces
        </Link>
        <Link
          href="/app/workspace"
          className={`block px-4 py-2 rounded transition-colors ${
            isActive('/app/collections') ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          Collections
        </Link>
        <Link
          href="/app/workspace"
          className={`block px-4 py-2 rounded transition-colors ${
            isActive('/app/history') ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          History
        </Link>
      </nav>

      <div className="p-6 border-t border-bg-tertiary">
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
