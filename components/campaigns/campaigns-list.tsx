'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Settings, MoreHorizontal, Calendar, Users, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptimisticLoading } from '@/components/providers/optimistic-loading-provider';

// Sample campaigns data
const campaigns = [
  {
    id: 'campaign-1',
    name: 'Winter Holiday Campaign',
    status: 'Live',
    segment: 'High Value Customers',
    lastUpdated: '2 days ago',
    audience: 1250,
    startDate: 'Dec 01',
    endDate: 'Jan 15',
    ctr: 4.2,
    conversions: 158
  },
  {
    id: 'campaign-2',
    name: 'Q1 Retention Program',
    status: 'Scheduled',
    segment: 'At Risk Customers',
    lastUpdated: '1 week ago',
    audience: 2420,
    startDate: 'Jan 05',
    endDate: 'Mar 31',
    ctr: 0,
    conversions: 0
  },
  {
    id: 'campaign-3',
    name: 'Product Launch Announcement',
    status: 'Draft',
    segment: 'All Customers',
    lastUpdated: '3 days ago',
    audience: 12800,
    startDate: 'TBD',
    endDate: 'TBD',
    ctr: 0,
    conversions: 0
  }
];

export function CampaignsList() {
  const { optimisticNavigate } = useOptimisticLoading();
  
  // Handle optimistic navigation to campaign creation page
  const handleCreateCampaign = () => {
    optimisticNavigate('/campaigns/create');
  };
  
  // Handle optimistic navigation to campaign details page
  const handleViewCampaign = (campaignId: string) => {
    optimisticNavigate(`/campaigns/${campaignId}`);
  };
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Campaigns</h2>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleCreateCampaign}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Campaign
        </Button>
      </div>
      
      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <Card 
            key={campaign.id}
            className="border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewCampaign(campaign.id)}
          >
            {/* Status Bar - Color coded by status */}
            <div className={`h-1.5 w-full ${getStatusColor(campaign.status)}`}></div>
            
            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-sm text-gray-500">Updated {campaign.lastUpdated}</div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        optimisticNavigate(`/campaigns/${campaign.id}/edit`);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        optimisticNavigate(`/campaigns/${campaign.id}`);
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>View</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              
              {/* Campaign Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Users className="mr-1.5 h-4 w-4" />
                    <span>Audience</span>
                  </div>
                  <div className="font-medium">{campaign.audience.toLocaleString()}</div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    <span>Time Period</span>
                  </div>
                  <div className="font-medium">
                    {campaign.startDate} - {campaign.endDate}
                  </div>
                </div>
                
                {campaign.status === 'Live' && (
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500">CTR</div>
                      <div className="font-semibold text-indigo-600">{campaign.ctr}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Conversions</div>
                      <div className="font-semibold text-indigo-600">{campaign.conversions}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-indigo-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        optimisticNavigate(`/campaigns/${campaign.id}/details`);
                      }}
                    >
                      View Stats
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper functions to get the right colors based on status
function getStatusColor(status: string) {
  switch (status) {
    case 'Live':
      return 'bg-green-500';
    case 'Scheduled':
      return 'bg-blue-500';
    case 'Draft':
      return 'bg-gray-300';
    default:
      return 'bg-gray-300';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Live':
      return 'bg-green-100 text-green-800';
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'Draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 