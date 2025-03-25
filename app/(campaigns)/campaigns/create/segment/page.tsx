'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignHeader } from '../../../_components/campaign-header';
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
  
  const filteredSegments = segments.filter(segment => 
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBack = () => {
    router.push('/campaigns/create/offers');
  };
  
  const handleNext = () => {
    // In a production app, we would save the selected segment
    // to a global state or backend before proceeding
    router.push('/campaigns');
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
        <CampaignHeader />
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="mb-4 md:mb-8">
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground mt-2">Step {step} of 3: Choose Target Segment</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Option 1: Choose existing segment */}
            <Card className={`border ${!useAiSegment ? 'border-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Use Existing Segment</CardTitle>
                    <CardDescription>
                      Select from your existing customer segments
                    </CardDescription>
                  </div>
                  <RadioGroup value={useAiSegment ? "ai" : "existing"} onValueChange={(value) => setUseAiSegment(value === "ai")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing" className="cursor-pointer">Select</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardHeader>
              <CardContent className={useAiSegment ? 'opacity-50 pointer-events-none' : ''}>
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
                              <p className="text-sm text-muted-foreground mt-1">
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
                            <Badge variant="outline" className="text-xs">
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
              </CardContent>
            </Card>
            
            {/* Option 2: Create AI segment */}
            <Card className={`border ${useAiSegment ? 'border-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CardTitle>Create with Hang AI</CardTitle>
                      <Badge className="ml-2 bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-none">
                        Hang AI
                      </Badge>
                    </div>
                    <CardDescription>
                      Describe your ideal audience in natural language
                    </CardDescription>
                  </div>
                  <RadioGroup value={useAiSegment ? "ai" : "existing"} onValueChange={(value) => setUseAiSegment(value === "ai")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ai" id="ai" />
                      <Label htmlFor="ai" className="cursor-pointer">Select</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardHeader>
              <CardContent className={!useAiSegment ? 'opacity-50 pointer-events-none' : ''}>
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900">
                    <div className="flex items-start">
                      <SparklesIcon className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm">
                          Describe your target audience in plain English. Our AI will create a segment based on your description.
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <p>Examples:</p>
                          <p>• "Customers who spend over $50 per order and visit at least once a week"</p>
                          <p>• "Customers who like spicy food and have ordered within the last month"</p>
                          <p>• "People who haven't ordered in 30 days but used to order weekly"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="ai-prompt">Describe your audience</Label>
                    <div className="mt-1.5">
                      <Input
                        id="ai-prompt"
                        placeholder="E.g., Frequent customers who typically order lunch..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onBlur={handlePromptBlur}
                        className="h-20"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-lg">
                    <div className="flex">
                      <UsersIcon className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          Estimated audience size
                        </p>
                        {isCalculating ? (
                          <p className="text-sm mt-1 text-muted-foreground">
                            Calculating size...
                          </p>
                        ) : showAudienceSize && aiPrompt.trim() && audienceSize !== null ? (
                          <p className="text-sm mt-1">
                            {audienceSize.toLocaleString()} customers
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            Enter a description to see an estimate
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
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
              onClick={handleNext} 
              disabled={!isFormValid}
              className="gap-1"
            >
              Finish <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
