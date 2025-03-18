'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, BarChart3, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from './_components/dashboard-header';

type Dashboard = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

export default function DashboardsPage() {
  const standardDashboards: Dashboard[] = [
    {
      name: 'Sales',
      href: '/dashboards/sales',
      icon: BarChart3,
      description: 'Review sales performance, top products, and sales forecasts.'
    },
    {
      name: 'Customers',
      href: '/dashboards/customers',
      icon: Users,
      description: 'Monitor customer growth, segments, and engagement metrics.'
    },
    {
      name: 'SKUs',
      href: '/dashboards/skus',
      icon: Tag,
      description: 'Analyze product inventories, performance, and availability.'
    }
  ];
  
  const customDashboards: Dashboard[] = [
    {
      name: 'My Dashboard',
      href: '/dashboards/my',
      icon: LayoutDashboard,
      description: 'Overview of your personal dashboard and performance metrics.'
    }
  ];

  // Render a dashboard card
  const renderDashboardCard = (dashboard: Dashboard) => (
    <Link 
      href={dashboard.href} 
      key={dashboard.href}
      className="block"
    >
      <Card className="h-full transition-colors hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-md font-medium">{dashboard.name}</CardTitle>
          <dashboard.icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardDescription>{dashboard.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Dashboards"
        description="Browse and access all available dashboards"
      />
      
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">Select a dashboard to view detailed metrics and analytics</p>
        </div>
        
        {/* Custom Dashboards Section */}
        <section className="mb-8">
          <h2 className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-4">Custom Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customDashboards.map(renderDashboardCard)}
          </div>
        </section>
        
        {/* Standard Dashboards Section */}
        <section>
          <h2 className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-4">Standard Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardDashboards.map(renderDashboardCard)}
          </div>
        </section>
      </div>
    </div>
  );
}
