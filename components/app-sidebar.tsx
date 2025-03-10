'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { PieChart, Users, Settings, PlusIcon } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' 
    ? '/images/Hang-Logo-Short-W.png' 
    : '/images/Hang-Logo-Short.png';

  const gradientClasses = resolvedTheme === 'dark'
    ? 'after:from-muted/30 after:via-muted/60 after:to-muted/30'
    : 'after:from-slate-200/50 after:via-slate-200/70 after:to-slate-200/50';

  return (
    <Sidebar 
      className={cn(
        "group-data-[side=left]:border-r-0 after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gradient-to-b",
        gradientClasses
      )}
    >
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center px-2"
            >
              <img 
                src={logoSrc}
                alt="Hang AI Logo"
                className="h-8 w-auto"
              />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboards">
                  <PieChart className="w-4 h-4 mr-2" />
                  Dashboards
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/segments">
                  <Users className="w-4 h-4 mr-2" />
                  Segments
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
