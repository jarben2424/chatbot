'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';

export function DashboardDetailHeader({ id }: { id: string }) {
  const { collapsed } = useSidebar();
  
  return (
    <div className="border-b">
      <div className="flex items-center h-[60px] px-4">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboards">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 