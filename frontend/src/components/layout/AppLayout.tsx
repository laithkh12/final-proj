'use client';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
