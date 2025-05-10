import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { 
  SidebarProvider,
  Sidebar as MainSidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { DashboardDetailHeader } from '@/components/dashboard/dashboard-detail-header';

export default async function DashboardPage({ params }: { params: { id: string } }) {
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
            <DashboardDetailHeader id={params.id} />
            <div className="flex-1 overflow-auto">
              <div className="h-full p-6">
                <DashboardView id={params.id} />
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 