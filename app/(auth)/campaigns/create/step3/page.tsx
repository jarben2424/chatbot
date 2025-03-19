'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

// Sample audience segments data
const segments = [
  {
    id: 'high-value',
    name: 'High Value Customers',
    description: 'Customers who spent over $1000',
    count: 1250
  },
  {
    id: 'recent-purchasers',
    name: 'Recent Purchasers',
    description: 'Customers who made a purchase in last 30 days',
    count: 3420
  },
  {
    id: 'at-risk',
    name: 'At Risk Customers',
    description: "Customers who haven't purchased in 90 days",
    count: 890
  }
];

export default function TargetAudiencePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (!sessionData || !sessionData.user) {
          window.location.href = '/sign-in';
          return;
        }
        setSession(sessionData);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    }

    getSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null; // This will never render as we redirect in useEffect
  }

  const handleOptimizeCampaign = () => {
    // In a real application, you would save this data and navigate to step 4
    router.push('/campaigns/create/optimization');
  };

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <CampaignsHeader title="Create Campaign" />
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="mx-auto max-w-4xl px-4 py-6">
                <div className="mb-4">
                  <h1 className="text-xl font-semibold mb-1">Create Campaign</h1>
                  <p className="text-sm text-muted-foreground">Create and optimize personalized offer campaigns</p>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200 -z-10"></div>
                  
                  {/* Connector Line with completed part */}
                  <div className="absolute top-1/2 left-0 w-1/2 h-[1px] bg-indigo-600 -z-10"></div>
                  
                  {/* Step 1 - Completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      1
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                  </div>
                  
                  {/* Step 2 - Completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      2
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                  </div>
                  
                  {/* Step 3 - Current */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      3
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Target Audience</span>
                  </div>
                  
                  {/* Step 4 - Upcoming */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      4
                    </div>
                    <span className="text-sm text-gray-500">Review & Sync</span>
                  </div>
                </div>
                
                {/* Audience Selection */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Select Segment</h2>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {segments.map((segment) => (
                      <div 
                        key={segment.id}
                        className={`p-4 border rounded-md cursor-pointer transition-all ${
                          selectedSegment === segment.id 
                            ? 'border-indigo-600 bg-indigo-50/30' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSegment(segment.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{segment.name}</h3>
                            <p className="text-sm text-gray-500">{segment.description}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {segment.count.toLocaleString()} users
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link href="/campaigns/create/step2">
                    <Button variant="outline">
                      Back
                    </Button>
                  </Link>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleOptimizeCampaign}
                    disabled={!selectedSegment}
                  >
                    Optimize Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 