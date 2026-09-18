'use client';

import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'var(--bg-base)',
          }}
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
