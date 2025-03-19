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
  Zap,
  ChevronRight
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
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Progress Steps */}
                <div className="relative mb-10">
                  {/* Line connecting steps */}
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
                  <div className="absolute top-6 left-0 w-1/8 h-1 bg-indigo-600 -z-10"></div>
                  
                  <div className="flex justify-between">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">1</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                        <span className="text-base font-medium">2</span>
                      </div>
                      <span className="text-sm text-gray-500">Select Offers</span>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                        <span className="text-base font-medium">3</span>
                      </div>
                      <span className="text-sm text-gray-500">Target Audience</span>
                    </div>
                    
                    {/* Step 4 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                        <span className="text-base font-medium">4</span>
                      </div>
                      <span className="text-sm text-gray-500">Review & Sync</span>
                    </div>
                  </div>
                </div>
                
                {/* Campaign Creation Form */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-2" htmlFor="campaignName">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div 
                        className={`p-6 border rounded-lg cursor-pointer transition-all ${selectedType === 'segment' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                        onClick={() => setSelectedType('segment')}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">Personalized Offers for a Segment</h3>
                              {selectedType === 'segment' && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">✓</div>}
                            </div>
                            <p className="text-sm text-gray-500">
                              Target specific customer segments with AI-optimized personalized offers. Perfect for focused campaigns and segment-specific promotions.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-6 border rounded-lg cursor-pointer transition-all ${selectedType === 'top' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                        onClick={() => setSelectedType('top')}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">Top Personalized Offers</h3>
                              {selectedType === 'top' && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">✓</div>}
                            </div>
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
                    className="bg-white hover:bg-slate-50 border-gray-200"
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