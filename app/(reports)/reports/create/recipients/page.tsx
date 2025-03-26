'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeftIcon, 
  PlusCircleIcon, 
  XIcon, 
  UserIcon,
  CheckIcon,
  MailIcon,
  InfoIcon
} from 'lucide-react';
import { useReportState } from '../../../_context/report-context';
import { useToast } from '@/components/ui/use-toast';

interface Recipient {
  email: string;
  name?: string;
}

export default function RecipientsPage() {
  const { reportState, updateReport, saveReport } = useReportState();
  const [recipients, setRecipients] = useState<Recipient[]>(reportState.recipients || []);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // Load saved data from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('reportData');
      if (savedData) {
        const { recipients: savedRecipients } = JSON.parse(savedData);
        if (savedRecipients && Array.isArray(savedRecipients)) {
          setRecipients(savedRecipients);
        }
      }
    } catch (error) {
      console.error('Error loading saved report data:', error);
    }
  }, []);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleAddRecipient = () => {
    if (!newRecipientEmail.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(newRecipientEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    if (recipients.some(r => r.email.toLowerCase() === newRecipientEmail.toLowerCase())) {
      setEmailError('This email is already added to the recipients list');
      return;
    }

    const newRecipient: Recipient = {
      email: newRecipientEmail,
      ...(newRecipientName.trim() ? { name: newRecipientName.trim() } : {})
    };

    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    setNewRecipientEmail('');
    setNewRecipientName('');
    setEmailError('');

    // Also update in localStorage
    try {
      const existingData = localStorage.getItem('reportData');
      const reportData = existingData ? JSON.parse(existingData) : {};
      
      localStorage.setItem('reportData', JSON.stringify({
        ...reportData,
        recipients: updatedRecipients,
      }));
    } catch (error) {
      console.error('Error saving recipients to localStorage:', error);
    }
  };

  const handleRemoveRecipient = (email: string) => {
    const updatedRecipients = recipients.filter(r => r.email !== email);
    setRecipients(updatedRecipients);

    // Also update in localStorage
    try {
      const existingData = localStorage.getItem('reportData');
      const reportData = existingData ? JSON.parse(existingData) : {};
      
      localStorage.setItem('reportData', JSON.stringify({
        ...reportData,
        recipients: updatedRecipients,
      }));
    } catch (error) {
      console.error('Error updating recipients in localStorage:', error);
    }
  };

  const handlePrevStep = () => {
    // Save current recipients to report context before going back
    updateReport({ recipients });
    router.push('/reports/create/schedule');
  };

  const handleCreateReport = async () => {
    // Save recipients to the report context
    updateReport({ recipients });
    
    setIsSubmitting(true);
    
    try {
      // Save the complete report
      await saveReport();
      
      // Show success message
      toast({
        title: "Report created successfully",
        description: "Your automated report has been set up and will be sent according to the schedule.",
        duration: 5000,
      });
      
      // Clear localStorage data for this report
      localStorage.removeItem('reportData');
      
      // Redirect to reports list page
      router.push('/reports');
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error creating report",
        description: "There was a problem creating your report. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full pb-24">
        <div className="mb-4 md:mb-8">
          <h1 className="text-3xl font-bold">Report Recipients</h1>
          <p className="text-muted-foreground">Step 3 of 3</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Recipients</CardTitle>
                <CardDescription>
                  Add email addresses of people who should receive this report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient-email">Email Address</Label>
                    <div className="relative mt-1.5">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="recipient-email"
                        type="email"
                        className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                        placeholder="email@example.com"
                        value={newRecipientEmail}
                        onChange={(e) => {
                          setNewRecipientEmail(e.target.value);
                          setEmailError('');
                        }}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-500 mt-1">{emailError}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="recipient-name">Name (Optional)</Label>
                    <div className="relative mt-1.5">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="recipient-name"
                        className="pl-10"
                        placeholder="John Smith"
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddRecipient} 
                    className="w-full gap-2"
                  >
                    <PlusCircleIcon className="h-4 w-4" /> Add Recipient
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recipients List</CardTitle>
                <CardDescription>
                  {recipients.length === 0 
                    ? "No recipients added yet"
                    : `${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} will receive this report`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recipients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed rounded-md p-4">
                    <UserIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Add at least one recipient to send this report</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipients.map((recipient) => (
                      <div 
                        key={recipient.email}
                        className="flex items-center justify-between bg-muted/50 rounded-md p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            {recipient.name && (
                              <p className="font-medium text-sm">{recipient.name}</p>
                            )}
                            <p className="text-sm text-muted-foreground">{recipient.email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveRecipient(recipient.email)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {recipients.length === 0 && (
          <div className="flex items-center gap-2 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
            <InfoIcon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">You need to add at least one recipient before you can create the report.</p>
          </div>
        )}
      </div>
      
      {/* Fixed navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
        <div className="max-w-7xl mx-auto w-full flex justify-between">
          <Button variant="outline" onClick={handlePrevStep} className="gap-1">
            <ChevronLeftIcon className="h-4 w-4" /> Previous
          </Button>
          <Button 
            onClick={handleCreateReport} 
            disabled={recipients.length === 0 || isSubmitting}
            className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>Creating Report...</>
            ) : (
              <>Create Report <CheckIcon className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
