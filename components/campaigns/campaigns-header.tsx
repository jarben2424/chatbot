'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { usePathname } from 'next/navigation';

interface CampaignsHeaderProps {
  title?: string;
  showCreateButton?: boolean;
  showBackButton?: boolean;
}

export function CampaignsHeader({ 
  title = "Personalized Campaigns", 
  showCreateButton,
  showBackButton
}: CampaignsHeaderProps) {
  const { open } = useSidebar();
  const pathname = usePathname();
  
  // Determine if we should show the create button
  // Only show on the main campaigns page, not in the creation flow
  const shouldShowCreateButton = showCreateButton ?? 
    (pathname === '/campaigns' || !pathname?.includes('/campaigns/create'));
  
  // Determine if we should show back button
  // Show back button on the main campaigns page
  const shouldShowBackButton = showBackButton ?? 
    (pathname === '/campaigns');
  
  return (
    <div className="border-b">
      <div className="flex items-center justify-between h-[60px] px-4">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          
          {shouldShowBackButton && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboards">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          
          {title && <h1 className="text-xl font-semibold ml-2">{title}</h1>}
        </div>
        
        {shouldShowCreateButton && (
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