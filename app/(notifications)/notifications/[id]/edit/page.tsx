'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  SaveIcon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { NotificationHeader } from '@/app/(notifications)/_components/notification-header';

// Report types from our schema
interface Report {
  id: string;
  title: string;
  description?: string;
  type: 'dashboard_update' | 'anomaly_detection' | 'recommendation';
  content: any;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  customSchedule?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
  recipients: Recipient[];
}

interface Recipient {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<'dashboard_update' | 'anomaly_detection' | 'recommendation'>('dashboard_update');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [customSchedule, setCustomSchedule] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  
  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/reports?id=${reportId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch report');
        }
        
        const data = await res.json();
        setReport(data);
        
        // Initialize form with report data
        setTitle(data.title || '');
        setDescription(data.description || '');
        setType(data.type || 'dashboard_update');
        setSchedule(data.schedule || 'weekly');
        setCustomSchedule(data.customSchedule || '');
        setIsActive(data.isActive !== undefined ? data.isActive : true);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Could not load report details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId]);
  
  // Save changes
  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Report title is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedReport = {
        id: reportId,
        title,
        description: description.trim() || undefined,
        type,
        schedule,
        customSchedule: schedule === 'custom' ? customSchedule : undefined,
        isActive,
        content: report?.content || {},
        recipients: report?.recipients || []
      };
      
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedReport),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update report');
      }
      
      toast({
        title: "Report updated",
        description: "Your changes have been saved",
      });
      
      // Redirect to report details page
      router.push(`/reports/${reportId}`);
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to save changes. Please try again later.');
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <NotificationHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <RefreshCwIcon className="animate-spin h-5 w-5" />
            <span>Loading report details...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !report) {
    return (
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <NotificationHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold tracking-tight">Error Loading Report</h2>
            <p className="text-muted-foreground">{error || 'Report not found'}</p>
            <Button asChild>
              <Link href="/reports">Return to Reports</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <NotificationHeader />
      
      <div className="flex-1 container max-w-4xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/reports/${reportId}`}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Edit Report</h1>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim()} 
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <RefreshCwIcon className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3">
            {error}
          </div>
        )}
        
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
                <CardDescription>
                  Basic information about your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Weekly Sales Summary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this report"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <RadioGroup 
                    value={type} 
                    onValueChange={(value) => setType(value as any)}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dashboard_update" id="dashboard_update" />
                      <Label htmlFor="dashboard_update">Dashboard Update</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anomaly_detection" id="anomaly_detection" />
                      <Label htmlFor="anomaly_detection">Anomaly Detection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recommendation" id="recommendation" />
                      <Label htmlFor="recommendation">Recommendation</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scheduling" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Schedule</CardTitle>
                <CardDescription>
                  Configure when and how often the report is sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Schedule</Label>
                  <RadioGroup 
                    value={schedule} 
                    onValueChange={(value) => setSchedule(value as any)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Custom</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {schedule === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customSchedule">Custom Schedule</Label>
                    <Input
                      id="customSchedule"
                      placeholder="Every Monday and Thursday at 9 AM"
                      value={customSchedule}
                      onChange={(e) => setCustomSchedule(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe your custom schedule in natural language
                    </p>
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isActive">Report is active</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6 mt-1">
                    When inactive, reports will not be sent according to schedule
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> To edit recipients or report content, please return to the report details page.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
