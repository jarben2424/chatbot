'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, CalendarIcon, UsersIcon, BarChart3, Zap, Users } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Completed Campaign Tile - Simplified Clean Version */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">New Campaign</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500">March 19, 2025</span>
                </div>
              </div>
              <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Active
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">Segment Campaign</span>
              <span className="text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">High Value Customers</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Customers</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">1,250</div>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Offers</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">5</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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