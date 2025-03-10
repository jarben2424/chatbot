'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Users, Megaphone } from 'lucide-react';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { theme } = useTheme();

  const navigationItems = [
    {
      name: 'Dashboards',
      href: '/dashboards',
      icon: LayoutDashboard
    },
    {
      name: 'Segments',
      href: '/segments',
      icon: Users
    },
    {
      name: 'Campaigns',
      href: '/campaigns',
      icon: Megaphone
    }
  ];

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 border-r border-r-border/40 
      dark:bg-gradient-to-l dark:from-border/40 dark:via-background/20 dark:to-transparent 
      light:bg-gradient-to-l light:from-zinc-300/70 light:via-zinc-200/40 light:to-transparent 
      shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
      <SidebarHeader className="h-[60px] flex items-center">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center px-2">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex items-center"
            >
              <Image
                src={theme === 'dark' 
                  ? '/images/Hang-Logo-Short-W.png'
                  : '/images/Hang-Logo-Short.png'
                }
                alt="Hang Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="h-9 w-9 p-0"
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
      
      <div className="px-3 py-2">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
            onClick={() => setOpenMobile(false)}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
      
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
