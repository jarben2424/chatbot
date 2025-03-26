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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRightIcon, 
  ActivityIcon, 
  LineChartIcon, 
  SparklesIcon, 
  BellIcon 
} from 'lucide-react';
import { useReportState } from '../../_context/report-context';

const reportTypes = [
  {
    id: 'dashboard_update',
    name: 'Dashboard Update',
    description: 'Regular updates on key metrics and performance indicators',
    icon: LineChartIcon,
    aiPowered: false,
  },
  {
    id: 'anomaly_detection',
    name: 'Anomaly Detection',
    description: 'Get alerts when unusual patterns or trends are detected',
    icon: ActivityIcon,
    aiPowered: true,
  },
  {
    id: 'recommendation',
    name: 'Recommendation Reports',
    description: 'AI-powered insights and recommendations for improvement',
    icon: BellIcon,
    aiPowered: true,
  },
];

export default function ReportCreatePage() {
  const { reportState, updateReport } = useReportState();
  const [selectedType, setSelectedType] = useState(reportState.type || 'dashboard_update');
  const [reportTitle, setReportTitle] = useState(reportState.title || '');
  const [reportDescription, setReportDescription] = useState(reportState.description || '');
  const router = useRouter();

  const handleNextStep = () => {
    // Save current progress to the report context
    updateReport({
      title: reportTitle,
      description: reportDescription,
      type: selectedType,
    });
    
    // Save to localStorage for persistence across steps
    try {
      const existingData = localStorage.getItem('reportData');
      const reportData = existingData ? JSON.parse(existingData) : {};
      
      localStorage.setItem('reportData', JSON.stringify({
        ...reportData,
        title: reportTitle,
        description: reportDescription,
        type: selectedType,
      }));
    } catch (error) {
      console.error('Error saving report data to localStorage:', error);
    }
    
    // Proceed to the next step (schedule selection)
    router.push('/reports/create/schedule');
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full pb-24">
          <div className="mb-4 md:mb-8">
            <h1 className="text-3xl font-bold">Create Automated Report</h1>
            <p className="text-muted-foreground">Step 1 of 3</p>
          </div>
          <div className="mb-6">
            <Label htmlFor="report-title" className="text-base mb-1.5">Report Title</Label>
            <Input 
              id="report-title" 
              placeholder="e.g. Weekly Performance Overview, Monthly Analytics" 
              className="w-full"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="report-description" className="text-base mb-1.5">Description (Optional)</Label>
            <Textarea 
              id="report-description" 
              placeholder="Provide a brief description of what this report will contain" 
              className="w-full resize-none"
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
          </div>
          <div className="mb-8">
            <Label className="text-base mb-2 block">Report Type</Label>
            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="grid gap-4 md:grid-cols-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div 
                    key={type.id}
                    className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedType === type.id 
                        ? type.aiPowered
                            ? 'border-indigo-500 bg-indigo-50/80 shadow-sm'
                            : 'border-gray-800 bg-gray-100 shadow-sm'
                        : type.aiPowered 
                          ? 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          : 'hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <RadioGroupItem 
                      value={type.id} 
                      id={type.id} 
                      className={`mt-1 ${
                        type.aiPowered 
                          ? 'text-indigo-500 border-indigo-500' 
                          : 'text-gray-800 border-gray-800'
                      }`} 
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center">
                        {type.aiPowered ? (
                          <SparklesIcon className="w-5 h-5 text-indigo-500 mr-2" />
                        ) : (
                          <Icon className="w-5 h-5 text-gray-800 mr-2" />
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
        </div>
        
        {/* Fixed navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
          <div className="max-w-7xl mx-auto w-full flex justify-between">
            <Button variant="outline" onClick={() => router.push('/reports')}>
              Cancel
            </Button>
            <Button 
              onClick={handleNextStep} 
              disabled={reportTitle.trim() === ''}
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
