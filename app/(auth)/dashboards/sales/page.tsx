import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChartPieIcon, MapPinIcon, ShareIcon } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

const salesDashboards = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <ChartPieIcon className="h-8 w-8 text-blue-500" />,
  },
  {
    id: 'location',
    title: 'Location',
    icon: <MapPinIcon className="h-8 w-8 text-green-500" />,
  },
  {
    id: 'channels',
    title: 'Channels',
    icon: <ShareIcon className="h-8 w-8 text-purple-500" />,
  },
];

export default async function SalesDashboardPage() {
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
            <DashboardHeader title="Sales Dashboards" />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {salesDashboards.map((dashboard) => (
                    <Link key={dashboard.id} href={`/dashboards/sales/${dashboard.id}`}>
                      <Card className="p-6 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer border-2 border-primary/20 shadow-md">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="p-2 bg-background rounded-md border">
                              {dashboard.icon}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold">{dashboard.title}</h3>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 