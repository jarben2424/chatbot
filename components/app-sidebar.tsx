'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Users, Megaphone, Cpu, Cable } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const { open, setOpenMobile } = useSidebar();
  const { theme, systemTheme } = useTheme();

  // Determine which logo to use
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' 
    ? '/images/Hang-Logo-Short-W.png'
    : '/images/Hang-Logo-Short.png';

  // Check if we're on the welcome/fresh chat screen
  const isWelcomeScreen = pathname === '/';

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
    },
    {
      name: 'AI Tools',
      href: '/ai-tools',
      icon: Cpu
    },
    {
      name: 'Connectors',
      href: '/connectors',
      icon: Cable
    }
  ];

  // Sidebar animation
  const sidebarVariants = {
    open: { 
      width: '280px',
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40
      }
    },
    closed: { 
      width: '56px',
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40
      }
    }
  };

  // Navigation item animation
  const linkVariants = {
    hover: { 
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      color: '#6366f1',
      scale: 1.01,
      transition: { duration: 0.2 }
    },
    active: {
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      color: '#6366f1',
      fontWeight: 500,
      scale: 1.01
    }
  };

  return (
    <motion.div
      initial={false}
      animate={open ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-full"
    >
      <Sidebar className="group-data-[side=left]:border-r border-r border-r-border/40 
        dark:bg-gradient-to-l dark:from-border/40 dark:via-background/20 dark:to-transparent 
        light:bg-gradient-to-l light:from-zinc-300/70 light:via-zinc-200/40 light:to-transparent 
        shadow-[2px_0_5px_rgba(0,0,0,0.1)] transition-all">
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
                  src={logoSrc}
                  alt="Hang Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </Link>
              {!isWelcomeScreen && (
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
              )}
            </div>
          </SidebarMenu>
        </SidebarHeader>
        
        <div className="px-3 py-2">
          {navigationItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <motion.div
                key={item.name}
                whileHover="hover"
                animate={isActive ? "active" : ""}
                variants={linkVariants}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                    isActive ? 'text-indigo-600 font-medium' : ''
                  }`}
                  onClick={() => setOpenMobile(false)}
                >
                  <item.icon className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-indigo-600' : ''
                  }`} />
                  <span className="transition-colors whitespace-nowrap overflow-hidden">{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
    </motion.div>
  );
}
