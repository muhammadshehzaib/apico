'use client';

import { usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/contexts/auth.context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = !pathname?.startsWith('/app/request') && !pathname?.startsWith('/request');

  return (
    <Provider store={store}>
      <AuthProvider>
        <div className="flex h-screen">
          {showSidebar && <Sidebar />}
          <main className={`flex-1 overflow-auto bg-bg-primary ${!showSidebar ? 'w-full' : ''}`}>
            {children}
          </main>
        </div>
      </AuthProvider>
    </Provider>
  );
}
