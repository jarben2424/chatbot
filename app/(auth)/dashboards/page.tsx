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
          <div className="flex-1">
            <DashboardHeader />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                <DashboardGrid />
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 