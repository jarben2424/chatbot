'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  IconHome,
  IconMessage,
  IconSettings,
  IconFile,
  IconDashboard,
  IconChart,
  IconDatabase
} from '@/components/ui/icons';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12', className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            <Link
              href="/chat"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/chat' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconMessage className="mr-2 h-4 w-4" />
              Chat
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/dashboard' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/documents"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/documents' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconFile className="mr-2 h-4 w-4" />
              Documents
            </Link>
            <Link
              href="/data"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/data' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconDatabase className="mr-2 h-4 w-4" />
              Data
            </Link>
            <Link
              href="/visualizations"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/visualizations' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconChart className="mr-2 h-4 w-4" />
              Visualizations
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                pathname === '/settings' && 'bg-accent text-accent-foreground'
              )}
            >
              <IconSettings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 