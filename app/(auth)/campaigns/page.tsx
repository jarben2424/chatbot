import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { PlusIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CampaignsList } from '@/components/campaigns/campaigns-list';

export default async function CampaignsPage() {
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
            <CampaignsHeader />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                <CampaignsList />
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 