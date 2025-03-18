'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { useWindowSize } from 'usehooks-ts';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardHeaderProps {
  title: string;
  description: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  customActions?: React.ReactNode;
}

export function DashboardHeader({ 
  title, 
  description, 
  isLoading = false,
  onRefresh,
  customActions
}: DashboardHeaderProps) {
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const pathname = usePathname();
  
  // Only show back button if not on the main dashboards page
  const showBackButton = pathname !== '/dashboards';

  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2 z-10">
      <div className="flex items-center gap-2">
        <SidebarToggle />
        
        {showBackButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                asChild
                className="md:px-2 md:h-fit"
              >
                <Link href="/dashboards">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to dashboards</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to dashboards</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 ml-auto">
        {customActions}

        {onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading}
                className="md:px-2 md:h-fit"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh dashboard</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end">Refresh dashboard</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
