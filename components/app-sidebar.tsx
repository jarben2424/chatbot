'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Users, Megaphone, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { theme } = useTheme();
  const [dashboardsOpen, setDashboardsOpen] = useState(false);

  // Auto-expand dashboards section if current path is under dashboards
  useEffect(() => {
    if (pathname?.startsWith('/dashboards')) {
      setDashboardsOpen(true);
    }
  }, [pathname]);

  const navigationItems = [
    {
      name: 'Dashboards',
      href: '/dashboards',
      icon: LayoutDashboard,
      children: [
        {
          name: 'My Dashboard',
          href: '/dashboards/my',
          tag: 'New'
        },
        {
          name: 'Sales',
          href: '/dashboards/sales',
        },
        {
          name: 'Customers',
          href: '/dashboards/customers',
        },
        {
          name: 'SKUs',
          href: '/dashboards/skus',
        }
      ]
    },
    {
      name: 'Customers',
      href: '/customers',
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
          </div>
        </SidebarMenu>
      </SidebarHeader>
      
      <div className="px-3 py-2 space-y-1">
        {navigationItems.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <button
                  onClick={() => setDashboardsOpen(!dashboardsOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname?.startsWith(item.href) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                  {dashboardsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {dashboardsOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                          pathname === child.href && "bg-accent/50 font-medium"
                        )}
                        onClick={() => setOpenMobile(false)}
                      >
                        <span className="flex-1">{child.name}</span>
                        {child.tag && (
                          <span className="ml-auto inline-flex h-5 items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {child.tag}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  pathname === item.href && "bg-accent/80 font-medium"
                )}
                onClick={() => setOpenMobile(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </div>
      
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
