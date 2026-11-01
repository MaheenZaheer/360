'use client';

import React, { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BusinessProvider } from '@/lib/hooks/use-business';
import type { Business } from '@/lib/types';

interface DashboardShellProps {
  user: { id: string; email: string };
  business: Business;
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reviews': 'Reviews',
  '/collect': 'Collect Feedback',
  '/analysis': 'Analysis',
  '/reports': 'Reports',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Prefix match for nested routes
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title;
  }

  return 'Feedback360';
}

function DashboardShell({ user, business, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <BusinessProvider user={user} business={business}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          user={{ email: user.email }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <Topbar
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          title={title}
          userEmail={user.email}
        />
        <main className="lg:ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </BusinessProvider>
  );
}

export { DashboardShell };
