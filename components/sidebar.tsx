'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Users, 
  Link as LinkIcon, 
  PieChart, 
  Layers,
  Cpu,
  Cable
} from 'lucide-react';

// Create navigation items with proper structure
const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: 'Dashboards',
    href: '/dashboards',
    icon: <PieChart className="h-5 w-5" />,
  },
  {
    title: 'Segments',
    href: '/segments',
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: 'Campaigns',
    href: '/campaigns',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'AI Tools',
    href: '/ai-tools',
    icon: <Cpu className="h-5 w-5" />,
  },
  {
    title: 'Connectors',
    href: '/connectors',
    icon: <Cable className="h-5 w-5" />,
  },
  {
    title: 'Connections',
    href: '/connections',
    icon: <LinkIcon className="h-5 w-5" />,
  },
  {
    title: 'Database',
    href: '/database',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar({ className }) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-1">
              {sidebarNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 