'use client';

import { useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Zap
} from 'lucide-react';
import { useEffect } from 'react';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campaignName, setCampaignName] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

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

  const handleNext = () => {
    // In a real application, you would save this data and navigate to step 2
    router.push('/campaigns/create/step2');
  };

  const handleSaveAsDraft = () => {
    // Save as draft functionality
    router.push('/campaigns');
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
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      1
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      2
                    </div>
                    <span className="text-sm text-gray-500">Select Offers</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      3
                    </div>
                    <span className="text-sm text-gray-500">Target Audience</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      4
                    </div>
                    <span className="text-sm text-gray-500">Review & Sync</span>
                  </div>
                </div>
                
                {/* Campaign Creation Form */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1" htmlFor="campaignName">
                      Campaign Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      id="campaignName"
                      placeholder="Segment" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  
                  <div>
                    <div className="block text-sm font-medium mb-4">Campaign Type</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-5 border rounded-lg cursor-pointer transition-all ${selectedType === 'segment' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedType('segment')}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Personalized Offers for a Segment</h3>
                            <p className="text-sm text-gray-500">
                              Target specific customer segments with AI-optimized personalized offers. Perfect for focused campaigns and segment-specific promotions.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-5 border rounded-lg cursor-pointer transition-all ${selectedType === 'top' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedType('top')}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Top Personalized Offers</h3>
                            <p className="text-sm text-gray-500">
                              Send personalized offers to a specific number of best-matched customers. Ideal for high-value customer retention and cross-sell opportunities.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveAsDraft}
                  >
                    Save as Draft
                  </Button>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleNext}
                    disabled={!campaignName || !selectedType}
                  >
                    Next
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