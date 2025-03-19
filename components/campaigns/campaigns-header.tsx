'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';

interface CampaignsHeaderProps {
  title?: string;
}

export function CampaignsHeader({ title }: CampaignsHeaderProps) {
  const { open } = useSidebar();
  
  return (
    <div className="border-b">
      <div className="flex items-center h-[60px] px-4">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          {title && <h1 className="text-xl font-semibold ml-2">{title}</h1>}
        </div>
      </div>
    </div>
  );
} 