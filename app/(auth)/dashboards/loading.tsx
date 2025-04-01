'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLoading() {
  return (
    <SidebarProvider>
      <div className="relative flex h-[100dvh]">
        <div className="flex w-full">
          <AppSidebar user={{ id: '', name: '', email: '' }} />
          <div className="flex-1">
            <DashboardHeader />
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="h-full p-6 max-w-7xl mx-auto">
                {/* Filters Skeleton */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-9 w-32 bg-muted-foreground/10" />
                  ))}
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6 bg-white shadow-md">
                      <Skeleton className="h-4 w-24 mb-4 bg-muted-foreground/10" />
                      <Skeleton className="h-8 w-28 mb-4 bg-muted-foreground/10" />
                      <Skeleton className="h-3 w-36 mb-4 bg-muted-foreground/10" />
                      <div className="flex flex-col space-y-2">
                        <Skeleton className="h-5 w-16 bg-muted-foreground/10" />
                        <Skeleton className="h-3 w-32 bg-muted-foreground/10" />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Chart Skeleton */}
                <Card className="p-6 mb-8 bg-white shadow-md">
                  <Skeleton className="h-6 w-48 mb-6 bg-muted-foreground/10" />
                  <div className="flex items-center space-x-4 mb-6">
                    <Skeleton className="h-3 w-20 bg-muted-foreground/10" />
                    <Skeleton className="h-3 w-20 bg-muted-foreground/10" />
                  </div>
                  <Skeleton className="h-80 w-full bg-muted-foreground/10" />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
} 