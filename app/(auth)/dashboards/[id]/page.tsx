import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { notFound } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

interface DashboardPageProps {
  params: {
    id: string;
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // Special case for the sales dashboard
  if (params.id === 'sales') {
    redirect('/dashboards/sales');
  }

  const dashboardMap: Record<string, { title: string; description: string }> = {
    'monthly-revenue': {
      title: 'Monthly Revenue',
      description: 'Track and analyze monthly revenue performance and trends.',
    },
    'customer-journey': {
      title: 'Customer Journey',
      description: 'Visualize and analyze the customer path from acquisition to conversion.',
    },
    'skus': {
      title: 'SKUs',
      description: 'Monitor inventory levels and performance metrics for all SKUs.',
    },
  };

  const dashboard = dashboardMap[params.id];
  
  if (!dashboard) {
    notFound();
  }

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <DashboardHeader title={dashboard.title} />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">{dashboard.title} Dashboard</h2>
                  <p className="text-muted-foreground">{dashboard.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 