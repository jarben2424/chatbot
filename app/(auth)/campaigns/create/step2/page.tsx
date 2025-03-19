'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  const handleNext = () => {
    // In a real application, you would save the selected offers
    router.push('/campaigns/create/step3');
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
                  
                  {/* Step 1 - Completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      1
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                  </div>
                  
                  {/* Step 2 - Current */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      2
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                  </div>
                  
                  {/* Step 3 - Upcoming */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      3
                    </div>
                    <span className="text-sm text-gray-500">Target Audience</span>
                  </div>
                  
                  {/* Step 4 - Upcoming */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2 z-10">
                      4
                    </div>
                    <span className="text-sm text-gray-500">Review & Sync</span>
                  </div>
                </div>
                
                {/* Offers Selection */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  {offers.map((offer, index) => (
                    <div 
                      key={offer.id}
                      className={`p-4 flex items-center justify-between ${index !== offers.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div>
                        <h3 className="font-medium">{offer.title}</h3>
                        <p className="text-sm text-gray-500">{offer.description}</p>
                      </div>
                      <div 
                        className={`w-5 h-5 rounded-full border ${selectedOffers.includes(offer.id) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'} cursor-pointer`}
                        onClick={() => handleSelectOffer(offer.id)}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link href="/campaigns/create">
                    <Button variant="outline">
                      Back
                    </Button>
                  </Link>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleNext}
                    disabled={selectedOffers.length === 0}
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