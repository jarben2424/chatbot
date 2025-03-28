'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  UsersIcon, 
  SearchIcon,
  FilterIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  SparklesIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCampaignState } from '@/app/(campaigns)/_context/campaign-context';
import type { CampaignState } from '@/app/(campaigns)/_context/campaign-context';

// Sample segments data
const segments = [
  {
    id: 'segment-1',
    name: 'High-Value Customers',
    description: 'Customers who have spent over $500 in the last 6 months',
    count: 1245,
    lastUpdated: '2025-03-20T10:30:00Z',
  },
  {
    id: 'segment-2',
    name: 'New Customers',
    description: 'Customers who made their first purchase in the last 30 days',
    count: 387,
    lastUpdated: '2025-03-22T14:15:00Z',
  },
  {
    id: 'segment-3',
    name: 'Lunch Regulars',
    description: 'Customers who frequently purchase during lunch hours (11am-2pm)',
    count: 892,
    lastUpdated: '2025-03-18T09:45:00Z',
  },
  {
    id: 'segment-4',
    name: 'Weekend Shoppers',
    description: 'Customers who primarily shop on weekends',
    count: 1056,
    lastUpdated: '2025-03-21T16:20:00Z',
  },
  {
    id: 'segment-5',
    name: 'Vegetarian Preference',
    description: 'Customers who frequently purchase vegetarian items',
    count: 623,
    lastUpdated: '2025-03-19T11:10:00Z',
  },
  {
    id: 'segment-6',
    name: 'Lapsed Customers',
    description: 'Previously active customers who haven\'t made a purchase in 90+ days',
    count: 1578,
    lastUpdated: '2025-03-23T08:30:00Z',
  },
];

export default function CampaignSegmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [useAiSegment, setUseAiSegment] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAudienceSize, setShowAudienceSize] = useState(false);
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const router = useRouter();
  const { campaignState, updateCampaign } = useCampaignState();
  
  const filteredSegments = segments.filter(segment => 
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBack = () => {
    router.push('/campaigns/create/offers');
  };
  
  const handleNext = () => {
    // Update campaign state with selected segment info
    const segmentInfo: Partial<CampaignState> = {
      useAiSegment,
      showMatchingAnimation: true, // Set to true when going to matching page
      matchingComplete: false, // Reset matching complete flag to ensure animation shows
      previousStep: 'segment' // Explicitly track that we're coming from segment page
    };
    
    if (useAiSegment) {
      segmentInfo.aiSegmentPrompt = aiPrompt;
      segmentInfo.audienceSize = audienceSize || undefined; // Fix type error
    } else {
      segmentInfo.selectedSegmentId = selectedSegmentId;
      // Get the audience size from the selected segment
      const selectedSegment = segments.find(s => s.id === selectedSegmentId);
      if (selectedSegment) {
        segmentInfo.audienceSize = selectedSegment.count;
      }
    }
    
    // Update campaign state
    updateCampaign(segmentInfo);
    
    // Navigate to matching page
    router.push('/campaigns/create/matching');
  };
  
  const handlePromptBlur = () => {
    if (aiPrompt.trim()) {
      setIsCalculating(true);
      setShowAudienceSize(false);
      
      // Simulate API call delay
      setTimeout(() => {
        // Generate a random but realistic audience size based on the prompt
        const baseSize = 900;
        const variance = 300;
        const generatedSize = Math.floor(baseSize + (Math.random() * variance));
        
        setAudienceSize(generatedSize);
        setIsCalculating(false);
        setShowAudienceSize(true);
      }, 1000);
    }
  };
  
  const step = 3;
  const isFormValid = useAiSegment ? aiPrompt.trim() !== '' : selectedSegmentId !== '';
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="mb-4 md:mb-8">
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">Step {step} of 5 - Choose Target Segment</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
            {/* Option 1: Choose existing segment */}
            <div className={`border rounded-lg p-6 ${!useAiSegment ? 'border-primary' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">Use Existing Segment</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Select from your existing customer segments
                  </p>
                </div>
                <RadioGroup value={useAiSegment ? "ai" : "existing"} onValueChange={(value) => setUseAiSegment(value === "ai")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="cursor-pointer">Select</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className={useAiSegment ? 'opacity-50 pointer-events-none' : ''}>
                <div className="space-y-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search segments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredSegments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No segments match your search</p>
                      </div>
                    ) : (
                      filteredSegments.map((segment) => (
                        <div 
                          key={segment.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedSegmentId === segment.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => !useAiSegment && setSelectedSegmentId(segment.id)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{segment.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1.5">
                                {segment.description}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {selectedSegmentId === segment.id && !useAiSegment && (
                                <CheckCircleIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center mt-2 space-x-4">
                            <Badge variant="outline" className="bg-muted/50">
                              {segment.count.toLocaleString()} customers
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Updated {formatDate(segment.lastUpdated)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Option 2: Create AI Segment */}
            <div className={`border rounded-lg p-6 ${useAiSegment ? 'border-primary' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <SparklesIcon className="h-5 w-5 text-indigo-500 mr-2" />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                      Create with Hang AI
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Describe your ideal audience in natural language
                  </p>
                </div>
                <RadioGroup value={useAiSegment ? "ai" : "existing"} onValueChange={(value) => setUseAiSegment(value === "ai")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ai" id="ai" className="text-indigo-500 border-indigo-500" />
                    <Label htmlFor="ai" className="cursor-pointer">Select</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className={!useAiSegment ? 'opacity-50 pointer-events-none' : ''}>
                <div className="space-y-4">
                  <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
                    Powered by Hang AI
                  </Badge>
                  <div>
                    <Label htmlFor="ai-prompt" className="text-sm font-medium mb-1.5 block">Describe your target audience</Label>
                    <Input
                      id="ai-prompt"
                      placeholder="e.g. Customers who purchased coffee at least twice last month and live in urban areas"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onBlur={handlePromptBlur}
                      className="w-full"
                    />
                  </div>
                  
                  {aiPrompt.trim() !== '' && (
                    <div className="p-3 border rounded-lg border-indigo-200 bg-indigo-50/50">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-indigo-700">Audience Size</span>
                      </div>
                      
                      {isCalculating ? (
                        <div className="flex items-center py-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse mr-1"></div>
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse delay-75 mr-1"></div>
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse delay-150 mr-1"></div>
                          <span className="text-sm text-indigo-600 ml-1">Calculating</span>
                        </div>
                      ) : showAudienceSize ? (
                        <div className="flex items-center">
                          <span className="text-xl font-bold text-indigo-700">{audienceSize?.toLocaleString()}</span>
                          <span className="text-sm text-indigo-600 ml-1">customers</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              onClick={handleNext} 
              disabled={!isFormValid}
              className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next Step <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
