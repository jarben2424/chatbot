'use client';

import { LineChart, BarChart, PieChart, Activity, Layers, Route, ShoppingCart, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useOptimisticLoading } from '@/components/providers/optimistic-loading-provider';

// My Dashboards item
const myDashboardsItem = {
  id: 'monthly-revenue',
  title: 'Monthly Revenue',
  description: 'Monthly revenue trends',
  icon: <DollarSign className="h-8 w-8 text-primary" />,
  type: 'revenue',
};

// Specific dashboards data
const specificDashboards = [
  {
    id: 'sales',
    title: 'Sales',
    description: 'Sales performance metrics',
    icon: <LineChart className="h-8 w-8 text-blue-500" />,
    type: 'line',
  },
  {
    id: 'customer-journey',
    title: 'Customer Journey',
    description: 'Customer path analysis',
    icon: <Route className="h-8 w-8 text-green-500" />,
    type: 'journey',
  },
  {
    id: 'skus',
    title: 'SKUs',
    description: 'Product inventory and SKU performance',
    icon: <ShoppingCart className="h-8 w-8 text-purple-500" />,
    type: 'inventory',
  },
];

export function DashboardGrid() {
  const { optimisticNavigate } = useOptimisticLoading();

  // Function to handle optimistic navigation
  const handleDashboardNavigation = (path: string) => {
    optimisticNavigate(path);
  };
  
  return (
    <div className="flex flex-col gap-8">
      {/* My Dashboards Row */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="p-6 hover:bg-primary/5 transition-colors cursor-pointer border-2 border-primary/20 shadow-md bg-gradient-to-br from-white to-primary/5"
            onClick={() => handleDashboardNavigation(`/dashboards/${myDashboardsItem.id}`)}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 rounded-md">
                  {myDashboardsItem.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary">{myDashboardsItem.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {myDashboardsItem.description}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Specific Dashboards Row */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specificDashboards.map((dashboard) => (
            <Card 
              key={dashboard.id} 
              className="p-6 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer border-2 border-primary/20 shadow-md"
              onClick={() => handleDashboardNavigation(`/dashboards/${dashboard.id}`)}
            >
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
          ))}
        </div>
      </div>
    </div>
  );
} 