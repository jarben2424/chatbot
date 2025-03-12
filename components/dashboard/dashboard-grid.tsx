'use client';

import { LineChart, BarChart, PieChart, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

// Sample dashboard data
const sampleDashboards = [
  {
    id: 'sales-metrics',
    title: 'Sales Metrics',
    description: 'Monthly revenue and sales performance',
    icon: <LineChart className="h-8 w-8 text-blue-500" />,
    type: 'line',
  },
  {
    id: 'user-analytics',
    title: 'User Analytics',
    description: 'User engagement and activity metrics',
    icon: <BarChart className="h-8 w-8 text-green-500" />,
    type: 'bar',
  },
  {
    id: 'market-share',
    title: 'Market Share',
    description: 'Product market distribution',
    icon: <PieChart className="h-8 w-8 text-purple-500" />,
    type: 'pie',
  },
  {
    id: 'performance',
    title: 'Performance Metrics',
    description: 'System performance indicators',
    icon: <Activity className="h-8 w-8 text-orange-500" />,
    type: 'line',
  },
];

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sampleDashboards.map((dashboard) => (
        <Link 
          key={dashboard.id} 
          href={`/dashboards/${dashboard.id}`}
          className="block"
        >
          <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer relative z-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-background rounded-md border">
                  {dashboard.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{dashboard.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.description}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 