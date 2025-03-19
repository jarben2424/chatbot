'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, CalendarIcon, UsersIcon, SparklesIcon } from 'lucide-react';

export function CampaignsList() {
  const [showCompletedCampaign, setShowCompletedCampaign] = useState(false);
  
  useEffect(() => {
    // Check if we've just completed creating a campaign
    const campaignCreated = sessionStorage.getItem('campaignCreated') === 'true';
    if (campaignCreated) {
      setShowCompletedCampaign(true);
      // Clear the flag
      sessionStorage.removeItem('campaignCreated');
    }
  }, []);
  
  if (showCompletedCampaign) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Completed Campaign Tile */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">3/8/2025</span>
              </div>
              <div className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Synced</div>
            </div>
            <h3 className="font-medium mb-2">Segment</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Segment Campaign</span>
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">High Value Customers</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">Customers</div>
                  <div className="text-lg">0</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-gray-400">🎁</div> 
                <div>
                  <div className="font-medium">Offers</div>
                  <div className="text-lg">5</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Free Large Drink</span>
                <span className="text-sm">BOGO Sandwich</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="text-sm">20% Off Family Meals</span>
                <span className="text-sm">+2 more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Empty state - Create Your First Campaign */}
      <Link href="/campaigns/create">
        <div className="border border-gray-200 border-dashed rounded-lg bg-white overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-col items-center justify-center text-center h-full relative">
            {/* Plus Button with subtle hover effect */}
            <div className="relative group">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors duration-200">
                <PlusIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2 text-gray-800">Create Your First Campaign</h3>
            <p className="text-sm text-gray-600 max-w-[220px]">
              Start personalizing offers for your customers
            </p>
            
            <div className="flex items-center justify-center space-x-1 text-indigo-600 font-medium mt-3">
              <span className="text-sm">Get started</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
} 