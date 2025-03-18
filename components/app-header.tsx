'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';

export function AppHeader() {
  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
    </header>
  );
}
