'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowDown, 
  ArrowRight, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Unlink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample customer-offer matching data
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
  },
  {
    id: 6,
    name: 'Lisa Garcia',
    email: 'l.garcia@example.com',
    offer: 'Free Large Drink'
  },
  {
    id: 7,
    name: 'David Kim',
    email: 'd.kim@example.com',
    offer: 'BOGO Sandwich'
  }
];

export default function ReviewSyncPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // For pagination demonstration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalItems = matchedCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentItems = matchedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    // In a real application, this would sync with Braze
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
              <div className="mx-auto max-w-5xl px-4 py-6">
                <div className="mb-4">
                  <h1 className="text-xl font-semibold mb-1">Create Campaign</h1>
                  <p className="text-sm text-muted-foreground">Create and optimize personalized offer campaigns</p>
                </div>
                
                {/* Progress Steps - All completed */}
                <div className="flex items-center justify-between mb-8 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-600 -z-10"></div>
                  
                  {/* All steps completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      1
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      2
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      3
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Target Audience</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 z-10">
                      4
                    </div>
                    <span className="text-sm font-medium text-indigo-600">Review & Sync</span>
                  </div>
                </div>
                
                {/* Results Table with matched customers and offers */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  <div className="p-4 flex justify-between items-center border-b border-gray-100">
                    <div>
                      <h2 className="text-lg font-semibold">Campaign Results</h2>
                      <p className="text-sm text-gray-500">{matchedCustomers.length} customers matched with personalized offers</p>
                    </div>
                    
                    <DropdownMenu open={isExportOpen} onOpenChange={setIsExportOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-gray-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                          <ArrowDown className="h-3 w-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>Download as CSV</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          <span>Download as Excel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Unlink className="h-4 w-4 mr-2" />
                          <span>Open in Google Sheets</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500 text-xs uppercase">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4 text-right">Matched Offer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentItems.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">{customer.id}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-medium">
                                  {customer.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-sm text-gray-500">{customer.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-indigo-600">{customer.offer}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="py-3 px-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <div>
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} customers
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="link" 
                        className="text-indigo-600 font-medium"
                        onClick={() => router.push('/campaigns/create/step4?fullList=true')}
                      >
                        Export full list
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link href="/campaigns/create/step3">
                    <Button variant="outline">
                      Back
                    </Button>
                  </Link>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleSyncToBraze}
                  >
                    Sync to Braze
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