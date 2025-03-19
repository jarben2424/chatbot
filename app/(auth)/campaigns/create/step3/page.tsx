'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RefreshCw, ChevronRight, ChevronLeft, Users } from 'lucide-react';

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
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Progress Steps */}
                <div className="relative mb-10">
                  {/* Line connecting steps */}
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
                  <div className="absolute top-6 left-0 w-1/2 h-1 bg-indigo-600 -z-10"></div>
                  
                  <div className="flex justify-between">
                    {/* Step 1 - Completed */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">✓</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                    </div>
                    
                    {/* Step 2 - Completed */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">✓</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                    </div>
                    
                    {/* Step 3 - Current */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">3</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Target Audience</span>
                    </div>
                    
                    {/* Step 4 - Upcoming */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                        <span className="text-base font-medium">4</span>
                      </div>
                      <span className="text-sm text-gray-500">Review & Sync</span>
                    </div>
                  </div>
                </div>
                
                {/* Audience Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Target Audience</h3>
                      <p className="text-sm text-gray-500">Select a customer segment for your campaign</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-indigo-200 hover:bg-indigo-50 text-indigo-600">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {segments.map((segment) => (
                      <div 
                        key={segment.id}
                        className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          selectedSegment === segment.id 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedSegment(segment.id)}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium">{segment.name}</h3>
                            <p className="text-sm text-gray-500">{segment.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-700 mr-4">
                            {segment.count.toLocaleString()} users
                          </div>
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedSegment === segment.id 
                                ? 'bg-indigo-600 text-white' 
                                : 'border-2 border-gray-300'
                            }`}
                          >
                            {selectedSegment === segment.id && <span className="text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSegment && (
                    <div className="mt-4 py-3 px-4 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                      <p>Selected segment: {segments.find(s => s.id === selectedSegment)?.name}</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link href="/campaigns/create/step2">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-gray-200">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleOptimizeCampaign}
                    disabled={!selectedSegment}
                  >
                    Optimize Campaign
                    <ChevronRight className="ml-1 h-4 w-4" />
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