'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { useWindowSize } from 'usehooks-ts';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

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

  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2 z-10">
      <SidebarToggle />

      {customActions}

      {onRefresh && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="md:px-2 px-2 md:h-fit ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh dashboard</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent align="end">Refresh dashboard</TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}
