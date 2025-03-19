'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowRight, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Unlink,
  ChevronLeft,
  ChevronRight,
  Users,
  EyeIcon,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SeamlessPageTransition } from '@/components/transitions/seamless-page-transition';
import { useOptimisticLoading } from '@/components/providers/optimistic-loading-provider';

// Sample customer-offer matching data (preview data only)
const matchedCustomers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'j.doe@example.com',
    offer: 'Free Large Drink' 
  },
  {
    id: 2,
    name: 'Sarah Smith',
    email: 's.smith@example.com',
    offer: 'BOGO Sandwich'
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    offer: '20% Off Family Meals'
  },
  {
    id: 4,
    name: 'Emma Wilson',
    email: 'emma.w@example.com',
    offer: 'Kids Eat Free'
  },
  {
    id: 5,
    name: 'James Brown',
    email: 'j.brown@example.com',
    offer: 'Double Points'
  }
];

// Total customers in the actual dataset
const totalCustomersMatched = 1250;

export default function ReviewSyncPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { optimisticNavigate } = useOptimisticLoading();
  
  // For data display
  const previewCount = matchedCustomers.length;

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

  const handleSyncToBraze = () => {
    // Show syncing state
    setIsSyncing(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // In a real application, this would sync with Braze
      // Set flag in sessionStorage to indicate campaign was created
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('campaignCreated', 'true');
      }
      optimisticNavigate('/campaigns');
    }, 2000); // 2 second delay to show syncing state
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
              initialPath="/campaigns/create/step4"
            >
              <div className="overflow-auto h-full w-full bg-slate-50/30">
                <div className="mx-auto max-w-5xl px-4 py-8">
                  {/* Progress Steps - All completed */}
                  <div className="relative mb-10">
                    {/* Line connecting steps - all completed */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-indigo-600 -z-10"></div>
                    
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
                      
                      {/* Step 3 - Completed */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                          <span className="text-base font-medium">✓</span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">Target Audience</span>
                      </div>
                      
                      {/* Step 4 - Current */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                          <span className="text-base font-medium">4</span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">Review & Sync</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Results Table with matched customers and offers */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <div className="p-6 flex justify-between items-center border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-medium mb-1">Campaign Results</h3>
                        <p className="text-sm text-gray-500">{totalCustomersMatched.toLocaleString()} customers matched with personalized offers</p>
                      </div>
                      
                      <DropdownMenu open={isExportOpen} onOpenChange={setIsExportOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="bg-white hover:bg-slate-50 border-gray-200 h-9 w-9"
                            title="Export Data"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border-gray-200">
                          <DropdownMenuItem className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Download as CSV</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            <span>Download as Excel</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">
                            <Unlink className="h-4 w-4 mr-2" />
                            <span>Open in Google Sheets</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Preview Badge */}
                    <div className="flex items-center justify-center border-b border-gray-100 py-2 bg-indigo-50/30">
                      <EyeIcon className="h-3 w-3 text-indigo-500 mr-1" />
                      <span className="text-xs font-medium text-indigo-700">Preview of first 5 customers</span>
                    </div>
                    
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-gray-200">
                          <tr className="text-left text-gray-500 text-xs uppercase">
                            <th className="py-3 px-6">#</th>
                            <th className="py-3 px-6">Customer</th>
                            <th className="py-3 px-6 text-right">Matched Offer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {matchedCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">{customer.id}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-medium">
                                    {customer.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-sm text-gray-500">{customer.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <span className="text-indigo-600 font-medium">{customer.offer}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Preview Footer */}
                    <div className="py-4 px-6 border-t border-gray-100 flex justify-between items-center text-sm bg-slate-50/30">
                      <div className="text-gray-500">
                        Showing preview: 5 of {totalCustomersMatched.toLocaleString()} total customers
                      </div>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost"
                          className="text-indigo-600 font-medium hover:bg-indigo-50"
                          onClick={() => router.push('/campaigns/create/step4?fullList=true')}
                        >
                          View all customers
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-start mb-4">
                      <div className="mr-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1">Campaign Summary</h3>
                        <p className="text-sm text-gray-500">High Value Customers segment with 5 personalized offers</p>
                        
                        <div className="mt-4 py-3 px-4 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                          <p>This campaign is ready to be synchronized with your marketing platform.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Link href="/campaigns/create/step3">
                      <Button 
                        variant="outline" 
                        className="bg-white hover:bg-slate-50 border-gray-200"
                        disabled={isSyncing}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back
                      </Button>
                    </Link>
                    
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleSyncToBraze}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing with Braze...
                        </>
                      ) : (
                        <>
                          Sync to Braze
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </>
                      )}
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