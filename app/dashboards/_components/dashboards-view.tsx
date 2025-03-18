'use client';

import { LayoutDashboard, Users, BarChart3, Tag } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from './dashboard-header';

// Define the dashboard type
type Dashboard = {
  name: string;
  href: string;
  icon: string;
  description: string;
};

// Map of icon names to components
const iconMap = {
  LayoutDashboard,
  Users,
  BarChart3,
  Tag
};

interface DashboardsViewProps {
  dashboards: Dashboard[];
}

export function DashboardsView({ dashboards }: DashboardsViewProps) {
  // Function to get the icon component based on the string name
  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent || LayoutDashboard; // Fallback to LayoutDashboard if not found
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Dashboards"
        description="Browse and access all available dashboards"
      />
      
      <div className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => {
            const IconComponent = getIcon(dashboard.icon);
            
            return (
              <Link 
                href={dashboard.href} 
                key={dashboard.href}
                className="block"
              >
                <Card className="h-full transition-colors hover:border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-md font-medium">{dashboard.name}</CardTitle>
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{dashboard.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
