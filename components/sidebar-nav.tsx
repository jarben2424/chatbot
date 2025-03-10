import { Home, PieChart, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  return (
    <nav className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 space-y-1">
        <Link 
          href="/chat" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Home className="w-4 h-4 mr-2" />
          Chat
        </Link>
        <Link 
          href="/dashboards" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <PieChart className="w-4 h-4 mr-2" />
          Dashboards
        </Link>
        <Link 
          href="/segments" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Users className="w-4 h-4 mr-2" />
          Segments
        </Link>
      </div>
      
      <div className="border-t pt-4 mb-4">
        <Link 
          href="/settings" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Link>
      </div>
    </nav>
  );
} 