'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar-toggle';

export function NotificationHeader() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isCreationFlow = pathname?.includes('/notifications/create');
  
  const handleExit = () => {
    // Exit the creation flow
    router.push('/notifications');
  };
  
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {isCreationFlow ? (
        // X button for notification creation flow
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleExit}
          className="h-9 w-9 border border-border rounded-md"
        >
          <XIcon className="h-5 w-5" />
        </Button>
      ) : (
        // Sidebar toggle for regular notifications page
        <SidebarToggle />
      )}
    </header>
  );
}
