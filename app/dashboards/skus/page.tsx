'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';

export default function SkusDashboardPage() {
  return (
    <div className="flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">SKUs Dashboard</h1>
          <p className="text-muted-foreground">Analyze product performance and inventory metrics</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top SKU</CardTitle>
            <CardDescription>By Sales Volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SKU-29458</div>
            <p className="text-sm">Premium Coffee Blend</p>
            <p className="text-xs text-green-500 flex items-center">
              $125,843 in revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <CardDescription>Current Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-amber-500 flex items-center">
              +12.3% from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <CardDescription>Needs Reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-red-500 flex items-center">
              +8 items since last week
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
