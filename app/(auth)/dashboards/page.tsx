import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { 
  SidebarProvider,
  Sidebar as MainSidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SeamlessPageTransition } from '@/components/transitions/seamless-page-transition';

export default async function DashboardsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <SeamlessPageTransition 
              variant="slide-right" 
              loadingType="dashboard"
              initialPath="/dashboards"
            >
              <div className="overflow-auto h-full w-full">
                <div className="h-full px-4 py-6">
                  <DashboardGrid />
                </div>
              </div>
            </SeamlessPageTransition>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 