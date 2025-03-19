'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import { SeamlessPageTransition } from '@/components/transitions/seamless-page-transition';
import { useOptimisticLoading } from '@/components/providers/optimistic-loading-provider';

// Sample offers data
const offers = [
  {
    id: 'free-large-drink',
    title: 'Free Large Drink',
    description: 'Get a free large drink with any purchase',
  },
  {
    id: 'bogo-sandwich',
    title: 'BOGO Sandwich',
    description: 'Buy one sandwich, get one free',
  },
  {
    id: 'five-off-25',
    title: '$5 Off $25+',
    description: 'Save $5 on orders over $25',
  },
  {
    id: 'free-side-upgrade',
    title: 'Free Side Upgrade',
    description: 'Upgrade any side to large size for free',
  },
  {
    id: 'family-meals-discount',
    title: '20% Off Family Meals',
    description: 'Save 20% on any family meal package',
  },
];

export default function SelectOffersPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const { optimisticNavigate } = useOptimisticLoading();

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

  const handleSelectOffer = (offerId: string) => {
    setSelectedOffers((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter(id => id !== offerId);
      } else {
        return [...prev, offerId];
      }
    });
  };
  
  const toggleSelectAll = () => {
    if (selectedOffers.length === offers.length) {
      // If all are selected, deselect all
      setSelectedOffers([]);
    } else {
      // Otherwise, select all
      setSelectedOffers(offers.map(offer => offer.id));
    }
  };

  const handleNext = () => {
    // In a real application, you would save the selected offers
    optimisticNavigate('/campaigns/create/step3');
  };

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1 flex flex-col">
            <CampaignsHeader title="Create Campaign" />
            <SeamlessPageTransition 
              variant="slide-left" 
              loadingType="campaign"
              initialPath="/campaigns/create/step2"
            >
              <div className="overflow-auto h-full w-full bg-slate-50/30">
                <div className="mx-auto max-w-4xl px-4 py-8">
                  {/* Progress Steps */}
                  <div className="relative mb-10">
                    {/* Line connecting steps */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
                    <div className="absolute top-6 left-0 w-1/4 h-1 bg-indigo-600 -z-10"></div>
                    
                    <div className="flex justify-between">
                      {/* Step 1 - Completed */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                          <span className="text-base font-medium">✓</span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                      </div>
                      
                      {/* Step 2 - Current */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                          <span className="text-base font-medium">2</span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                      </div>
                      
                      {/* Step 3 - Upcoming */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                          <span className="text-base font-medium">3</span>
                        </div>
                        <span className="text-sm text-gray-500">Target Audience</span>
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
                  
                  {/* Offers Selection */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-medium mb-1">Select Offers</h3>
                        <p className="text-sm text-gray-500">Choose offers to include in your campaign</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={toggleSelectAll}
                        className="border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                      >
                        {selectedOffers.length === offers.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    
                    <div className="space-y-4 mt-6">
                      {offers.map((offer) => (
                        <div 
                          key={offer.id}
                          className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${selectedOffers.includes(offer.id) ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                          onClick={() => handleSelectOffer(offer.id)}
                        >
                          <div className="flex items-start">
                            <div className="mr-4">
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Gift className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium">{offer.title}</h3>
                              <p className="text-sm text-gray-500">{offer.description}</p>
                            </div>
                          </div>
                          
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedOffers.includes(offer.id) ? 'bg-indigo-600 text-white' : 'border-2 border-gray-300'}`}
                          >
                            {selectedOffers.includes(offer.id) && <span className="text-xs">✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 py-3 px-4 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                      <p>Selected {selectedOffers.length} of {offers.length} offers</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Link href="/campaigns/create">
                      <Button variant="outline" className="bg-white hover:bg-slate-50 border-gray-200">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back
                      </Button>
                    </Link>
                    
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleNext}
                      disabled={selectedOffers.length === 0}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </SeamlessPageTransition>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 