import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-semibold">Personalized Campaigns</h1>
                  <Link href="/campaigns/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                </div>

                {/* Empty state - Create Your First Campaign */}
                <Link href="/campaigns/create">
                  <div className="border border-dashed border-indigo-300 rounded-lg bg-indigo-50/50 h-44 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/70 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                      <PlusIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-medium mb-1">Create Your First Campaign</h3>
                    <p className="text-sm text-muted-foreground">Start personalizing offers for your customers</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 