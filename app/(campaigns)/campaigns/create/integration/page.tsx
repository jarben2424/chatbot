'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignHeader } from '../../../_components/campaign-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpFromLineIcon,
  ExternalLinkIcon,
  CheckIcon,
  SparklesIcon,
  MailIcon
} from 'lucide-react';

export default function CampaignIntegrationPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/campaigns/create/matching');
  };
  
  const handleFinish = () => {
    // In a real app, we would process the selected integration option
    // For now, just redirect to the campaigns listing
    router.push('/campaigns');
  };
  
  const step = 5;
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="mb-4 md:mb-8">
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">Step {step} of 5 - Choose Integration</p>
          </div>
          
          {/* Info banner with sparkles icon */}
          <div className="bg-[#5640E8]/5 border border-[#5640E8]/10 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#5640E8]/10 p-2 flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-[#5640E8]" />
              </div>
              <div>
                <h3 className="font-medium text-[#5640E8]">One More Step</h3>
                <p className="text-sm">
                  Your personalized offers are ready to be delivered to customers.
                  Choose how you'd like to manage this campaign.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Klaviyo integration card */}
            <Card 
              className={`border-2 cursor-pointer hover:border-[#5640E8]/40 transition-all ${
                selectedOption === 'klaviyo' ? 'border-[#5640E8] shadow-md' : 'border-border'
              }`}
              onClick={() => setSelectedOption('klaviyo')}
            >
              <div className="absolute top-3 right-3">
                {selectedOption === 'klaviyo' && (
                  <div className="h-5 w-5 rounded-full bg-[#5640E8] flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#5640E8]/10 flex items-center justify-center">
                    <MailIcon className="h-5 w-5 text-[#5640E8]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sync to Klaviyo</CardTitle>
                    <CardDescription>Send personalized offers via email or SMS</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Automatically create segmented lists in Klaviyo</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Schedule email and SMS campaigns</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Track opens, clicks, and conversions</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ExternalLinkIcon className="h-3 w-3" />
                  Automated syncing with your connected Klaviyo account
                </div>
              </CardFooter>
            </Card>
            
            {/* Export card */}
            <Card 
              className={`border-2 cursor-pointer hover:border-[#5640E8]/40 transition-all ${
                selectedOption === 'export' ? 'border-[#5640E8] shadow-md' : 'border-border'
              }`}
              onClick={() => setSelectedOption('export')}
            >
              <div className="absolute top-3 right-3">
                {selectedOption === 'export' && (
                  <div className="h-5 w-5 rounded-full bg-[#5640E8] flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#5640E8]/10 flex items-center justify-center">
                    <ArrowUpFromLineIcon className="h-5 w-5 text-[#5640E8]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Export</CardTitle>
                    <CardDescription>Download campaign data for external use</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Export as CSV, Excel, or JSON format</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Includes all customer and offer matching details</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                    <p>Compatible with most marketing platforms</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ArrowUpFromLineIcon className="h-3 w-3" />
                  Secure, encrypted export
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Fixed navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
          <div className="max-w-7xl mx-auto w-full flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={!selectedOption}
              className="gap-1 bg-[#5640E8] hover:bg-[#5640E8]/90 text-white"
            >
              Complete Campaign <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
