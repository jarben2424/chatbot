'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignHeader } from '../../_components/campaign-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ChevronRightIcon, SparklesIcon, TagIcon, UsersIcon, ZapIcon } from 'lucide-react';

const campaignTypes = [
  {
    id: 'personalized-segment',
    name: 'Personalized Offers for a Segment',
    description: 'Create targeted offers for a specific customer segment',
    icon: UsersIcon,
    aiPowered: true,
  },
  {
    id: 'top-personalized',
    name: 'Top Personalized Offers',
    description: 'Send best personalized offers to all qualifying customers',
    icon: ZapIcon,
    aiPowered: true,
  },
  {
    id: 'manual-creation',
    name: 'Manual Creation',
    description: 'Build a campaign from scratch with full control',
    icon: TagIcon,
    aiPowered: false,
  },
];

export default function CreateCampaignPage() {
  const [campaignName, setCampaignName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [step, setStep] = useState(1);
  const router = useRouter();
  
  const handleNext = () => {
    // In a real implementation, we would save the data before moving to the next step
    router.push('/campaigns/create/offers');
  };
  
  const isFormValid = campaignName.trim() !== '' && selectedType !== '';
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground mt-2">Step {step} of 3: Campaign Setup</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Name your campaign and select the type that best fits your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input 
                  id="campaign-name" 
                  placeholder="Enter campaign name" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Campaign Type</Label>
                <RadioGroup value={selectedType} onValueChange={setSelectedType}>
                  {campaignTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div 
                        key={type.id}
                        className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedType === type.id 
                            ? type.aiPowered
                                ? 'border-indigo-500 bg-indigo-50/80 shadow-sm'
                                : 'border-primary bg-primary/5'
                            : type.aiPowered 
                              ? 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                              : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <RadioGroupItem value={type.id} id={type.id} className={`mt-1 ${type.aiPowered ? 'text-indigo-500 border-indigo-500' : ''}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center">
                            {type.aiPowered ? (
                              <SparklesIcon className="w-5 h-5 text-indigo-500 mr-2" />
                            ) : (
                              <Icon className="w-5 h-5 text-primary mr-2" />
                            )}
                            <Label 
                              htmlFor={type.id} 
                              className={`font-medium cursor-pointer ${
                                type.aiPowered ? 'bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent' : ''
                              }`}
                            >
                              {type.name}
                            </Label>
                            {type.aiPowered && (
                              <Badge className="ml-2 bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-none">
                                Hang AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/campaigns')}>
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!isFormValid}
                className="gap-1"
              >
                Next Step <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
