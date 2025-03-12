'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';

export default function SalesDashboardPage() {
  return (
    <div className="flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Track revenue performance and sales metrics</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CardDescription>MTD vs. Previous Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$352,924</div>
            <p className="text-xs text-green-500 flex items-center">
              +12.3% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$42.85</div>
            <p className="text-xs text-green-500 flex items-center">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.4%</div>
            <p className="text-xs text-red-500 flex items-center">
              -0.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-1">
        <DashboardQueriesList />
      </div>
    </div>
  );
}
