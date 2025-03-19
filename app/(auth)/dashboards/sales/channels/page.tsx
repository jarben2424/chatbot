import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default async function SalesChannelsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <DashboardHeader title="Sales by Channel" />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Sales Channels Dashboard</h2>
                  <p className="text-muted-foreground">This dashboard analyzes sales performance across different marketing and sales channels.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 