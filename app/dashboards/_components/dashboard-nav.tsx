'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { 
    name: 'My Dashboard', 
    href: '/dashboards/my',
    description: 'Overview of your personalized metrics'
  },
  { 
    name: 'Sales', 
    href: '/dashboards/sales',
    description: 'Revenue and sales metrics'
  },
  { 
    name: 'Customers', 
    href: '/dashboards/customers',
    description: 'Customer acquisition and retention'
  },
  { 
    name: 'SKUs', 
    href: '/dashboards/skus',
    description: 'Product performance metrics'
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === tab.href
                  ? "text-foreground border-b-2 border-primary pb-4"
                  : "text-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
