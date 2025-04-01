'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function SalesDashboardLoading() {
  return (
    <SidebarProvider>
      <div className="relative flex h-[100dvh]">
        <div className="flex w-full">
          <AppSidebar user={{ id: '', name: '', email: '' }} />
          <div className="flex-1">
            <DashboardHeader title="Sales" />
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="h-full p-6 max-w-7xl mx-auto">
                {/* Dashboard Selection Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border bg-card relative overflow-hidden">
                      <div className="p-6">
                        <Skeleton className="h-6 w-32 mb-3 bg-muted-foreground/10" />
                        <Skeleton className="h-4 w-48 mb-5 bg-muted-foreground/10" />
                      </div>
                      {/* Background pattern skeleton */}
                      <div className="absolute -bottom-2 -right-2 opacity-10">
                        <Skeleton className="h-24 w-24 rounded-full bg-muted-foreground/10" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
} 