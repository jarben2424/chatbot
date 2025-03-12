import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '@/app/(auth)/auth';
import { cookies } from 'next/headers';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} />
          <SidebarInset>
            <main className="flex-1 overflow-auto">
              <div className="flex flex-col h-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
