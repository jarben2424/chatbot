'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';

interface CampaignsHeaderProps {
  title?: string;
  showCreateButton?: boolean;
}

export function CampaignsHeader({ title = "Personalized Campaigns", showCreateButton = true }: CampaignsHeaderProps) {
  const { open } = useSidebar();
  
  return (
    <div className="border-b">
      <div className="flex items-center justify-between h-[60px] px-4">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          {title && <h1 className="text-xl font-semibold ml-2">{title}</h1>}
        </div>
        
        {showCreateButton && (
          <Link href="/campaigns/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
} 