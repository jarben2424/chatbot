'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { memo } from 'react';
import useSWR from 'swr';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { cn } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { VisibilitySelector } from './visibility-selector';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { fetcher } from '@/lib/utils';
import { ModelSelector } from '@/components/model-selector';
import Image from 'next/image';

// Add the VisibilityType type directly in this file
type VisibilityType = 'private' | 'public';

interface ChatHeaderProps {
  chatId: string;
  selectedModelId: string;
  isReadonly: boolean;
}

function PureChatHeader({
  chatId,
  selectedModelId,
  isReadonly,
}: ChatHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { data: rateLimit } = useSWR('/api/rate-limit', fetcher);
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibility: 'private',
  });
  
  const { theme, systemTheme } = useTheme();
  // Determine which logo to use
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' 
    ? '/images/Hang-Logo-Short-W.png'
    : '/images/Hang-Logo-Short.png';
    
  // Check if we're on the welcome/fresh chat screen
  const isWelcomeScreen = pathname === '/';

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
      <SidebarToggle />

      {(!open || windowWidth < 768) && !isWelcomeScreen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className={cn("order-1 md:order-2", isWelcomeScreen && !open ? "mr-auto" : "")}
        />
      )}

      {rateLimit && !rateLimit.isPaid && (
        <div className="text-xs text-muted-foreground">
          {rateLimit.remaining} of {rateLimit.total} messages remaining today
        </div>
      )}
      
      {/* Add Hang logo in the header when on welcome screen */}
      {isWelcomeScreen && (
        <div className="ml-auto order-last absolute right-4 top-1/2 -translate-y-1/2">
          <Image
            src="/images/Hang-Logo-Full-RichBlack.png"
            alt="Hang AI"
            width={150}
            height={44}
            priority
            className="h-14 w-auto"
          />
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
