'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';

export default function CustomersDashboardPage() {
  return (
    <div className="flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers Dashboard</h1>
          <p className="text-muted-foreground">Monitor customer acquisition and retention metrics</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,458</div>
            <p className="text-xs text-green-500 flex items-center">
              +15.6% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.2%</div>
            <p className="text-xs text-green-500 flex items-center">
              +3.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
            <CardDescription>Average per customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$847.63</div>
            <p className="text-xs text-green-500 flex items-center">
              +5.8% from last quarter
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
