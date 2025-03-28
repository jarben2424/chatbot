'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  ClockIcon, 
  MailIcon,
  PlusIcon, 
  SaveIcon, 
  TrashIcon, 
  UserPlusIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { NotificationProvider, useNotificationContext } from '../../../_context/notification-context';

// Mock recipients for the demo
const MOCK_RECIPIENTS = [
  { id: 'r1', email: 'john.doe@example.com', name: 'John Doe' },
  { id: 'r2', email: 'jane.smith@example.com', name: 'Jane Smith' },
  { id: 'r3', email: 'michael.johnson@example.com', name: 'Michael Johnson' },
  { id: 'r4', email: 'emily.williams@example.com', name: 'Emily Williams' },
  { id: 'r5', email: 'david.brown@example.com', name: 'David Brown' },
  { id: 'r6', email: 'olivia.jones@example.com', name: 'Olivia Jones' },
];

// Wrapper component with NotificationProvider
export default function RecipientsPageWrapper() {
  return (
    <NotificationProvider>
      <RecipientsPage />
    </NotificationProvider>
  );
}

function RecipientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { notification, updateNotificationField } = useNotificationContext();
  
  // Local state
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; email: string; name?: string }[]>(
    notification.recipients || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [schedule, setSchedule] = useState<string>(notification.schedule || 'weekly');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter recipients by search term
  const filteredRecipients = MOCK_RECIPIENTS.filter(recipient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      recipient.email.toLowerCase().includes(searchLower) ||
      (recipient.name && recipient.name.toLowerCase().includes(searchLower))
    );
  });

  // Check if email is valid
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add a new recipient
  const addRecipient = () => {
    if (!newRecipientEmail || !isValidEmail(newRecipientEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if already in the list
    if (selectedRecipients.some(r => r.email.toLowerCase() === newRecipientEmail.toLowerCase())) {
      toast({
        title: "Duplicate recipient",
        description: "This email is already in the recipient list",
        variant: "destructive",
      });
      return;
    }

    // Add to the list
    const newRecipient = {
      id: `custom-${Date.now()}`,
      email: newRecipientEmail,
      name: newRecipientName || undefined,
    };

    setSelectedRecipients([...selectedRecipients, newRecipient]);
    
    // Reset form
    setNewRecipientEmail('');
    setNewRecipientName('');
    
    toast({
      title: "Recipient added",
      description: newRecipientName ? `${newRecipientName} (${newRecipientEmail})` : newRecipientEmail,
    });
  };

  // Remove a recipient
  const removeRecipient = (id: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.id !== id));
  };

  // Add from suggestions
  const addFromSuggestion = (recipient: typeof MOCK_RECIPIENTS[0]) => {
    // Check if already in the list
    if (selectedRecipients.some(r => r.id === recipient.id)) {
      return;
    }
    
    setSelectedRecipients([...selectedRecipients, recipient]);
    
    toast({
      title: "Recipient added",
      description: recipient.name ? `${recipient.name} (${recipient.email})` : recipient.email,
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    setIsSaving(true);
    
    // Update notification context
    updateNotificationField('recipients', selectedRecipients);
    updateNotificationField('schedule', schedule as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom');
    updateNotificationField('recipientCount', selectedRecipients.length);
    
    // Simulate API save
    setTimeout(() => {
      setIsSaving(false);
      
      toast({
        title: "Report created successfully",
        description: `${notification.title} will be sent ${schedule} to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''}`,
      });
      
      // Navigate back to notifications list
      router.push('/notifications');
    }, 1000);
  };

  const handleBack = () => {
    router.push('/notifications/create/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Add Recipients & Schedule</h1>
        <p className="text-muted-foreground">
          Choose who should receive your {notification.title} report and when
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
            <CardDescription>
              Choose how frequently to send this dashboard report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={schedule} onValueChange={setSchedule} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`flex flex-col items-center justify-center rounded-md border p-4 ${schedule === 'daily' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <RadioGroupItem value="daily" id="daily" className="sr-only" />
                <Label htmlFor="daily" className="cursor-pointer text-center">
                  <ClockIcon className="h-5 w-5 mx-auto mb-2" />
                  <div className="font-medium">Daily</div>
                </Label>
              </div>
              
              <div className={`flex flex-col items-center justify-center rounded-md border p-4 ${schedule === 'weekly' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <RadioGroupItem value="weekly" id="weekly" className="sr-only" />
                <Label htmlFor="weekly" className="cursor-pointer text-center">
                  <ClockIcon className="h-5 w-5 mx-auto mb-2" />
                  <div className="font-medium">Weekly</div>
                </Label>
              </div>
              
              <div className={`flex flex-col items-center justify-center rounded-md border p-4 ${schedule === 'monthly' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                <Label htmlFor="monthly" className="cursor-pointer text-center">
                  <ClockIcon className="h-5 w-5 mx-auto mb-2" />
                  <div className="font-medium">Monthly</div>
                </Label>
              </div>
              
              <div className={`flex flex-col items-center justify-center rounded-md border p-4 ${schedule === 'quarterly' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <RadioGroupItem value="quarterly" id="quarterly" className="sr-only" />
                <Label htmlFor="quarterly" className="cursor-pointer text-center">
                  <ClockIcon className="h-5 w-5 mx-auto mb-2" />
                  <div className="font-medium">Quarterly</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recipients</CardTitle>
            <CardDescription>
              Add people who should receive this report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new recipient form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <Label htmlFor="recipient-email">Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
              </div>
              <div className="md:col-span-5">
                <Label htmlFor="recipient-name">Name (Optional)</Label>
                <Input
                  id="recipient-name"
                  placeholder="John Doe"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button 
                  onClick={addRecipient} 
                  className="w-full"
                  disabled={!newRecipientEmail || !isValidEmail(newRecipientEmail)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Selected recipients list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Selected Recipients ({selectedRecipients.length})</h3>
              </div>
              
              {selectedRecipients.length === 0 ? (
                <div className="text-center py-4 border rounded-md text-muted-foreground">
                  <MailIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No recipients added yet</p>
                  <p className="text-sm">Add recipients above or select from suggestions</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[200px] overflow-y-auto">
                  <div className="space-y-2">
                    {selectedRecipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{recipient.email}</span>
                          {recipient.name && (
                            <span className="text-xs text-muted-foreground">{recipient.name}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(recipient.id)}
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* Suggestions */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Suggestions</h3>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-[200px] h-8 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredRecipients.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm col-span-2">
                    No matches found
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className={`flex items-center justify-between p-2 border rounded-md cursor-pointer transition-colors ${
                        selectedRecipients.some(r => r.id === recipient.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => addFromSuggestion(recipient)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{recipient.email}</span>
                        {recipient.name && (
                          <span className="text-xs text-muted-foreground">{recipient.name}</span>
                        )}
                      </div>
                      {selectedRecipients.some(r => r.id === recipient.id) ? (
                        <CheckIcon className="h-4 w-4 text-primary" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Fixed navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-background border-t flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={isSaving || selectedRecipients.length === 0}
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <SaveIcon className="mr-2 h-4 w-4" />
              Create Report
            </>
          )}
        </Button>
      </div>
      
      {/* Spacer to prevent content from being hidden behind the footer */}
      <div className="h-20"></div>
    </div>
  );
}
