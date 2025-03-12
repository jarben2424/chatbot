'use client';

import { useState, useId } from 'react';
import { Button } from './ui/button';
import { Bell, Check, Clock, User, Plus, ListFilter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { saveEmailSubscription, DashboardEmailSubscription, getLocalDashboardQueries } from '@/lib/local-storage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EmailCadence = 'daily' | 'weekly' | 'monthly';

interface AddEmailSubscriptionButtonProps {
  initialSubscriptionName?: string;
}

export function AddEmailSubscriptionButton({ initialSubscriptionName }: AddEmailSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialSubscriptionName || '');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [cadence, setCadence] = useState<EmailCadence>('weekly');
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [availableQueries, setAvailableQueries] = useState<{id: string, title: string}[]>([]);
  
  // Load available dashboard queries when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const queries = getLocalDashboardQueries();
      setAvailableQueries(queries.map(q => ({ id: q.id, title: q.title })));
    }
    setOpen(open);
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const handleToggleQuery = (id: string) => {
    setSelectedQueries(prev => {
      if (prev.includes(id)) {
        return prev.filter(queryId => queryId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleAddSubscription = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate inputs
      if (!name.trim()) {
        toast.error('Please provide a subscription name');
        setIsSubmitting(false);
        return;
      }
      
      const validRecipients = recipients.filter(r => r.trim() !== '');
      if (validRecipients.length === 0) {
        toast.error('Please provide at least one email recipient');
        setIsSubmitting(false);
        return;
      }
      
      if (selectedQueries.length === 0) {
        toast.error('Please select at least one dashboard metric');
        setIsSubmitting(false);
        return;
      }
      
      // Create subscription object
      const newSubscription: Omit<DashboardEmailSubscription, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        recipients: validRecipients,
        dashboardQueryIds: selectedQueries,
        cadence,
        active: true,
      };
      
      // Save subscription
      saveEmailSubscription(newSubscription);
      
      setIsAdded(true);
      toast.success('Email subscription created');
      
      setTimeout(() => {
        setOpen(false);
        setIsAdded(false);
        
        // Reset form
        setName('');
        setRecipients(['']);
        setCadence('weekly');
        setSelectedQueries([]);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="h-8 gap-1"
        onClick={() => handleOpenChange(true)}
      >
        <Bell className="h-4 w-4 mr-1" />
        <span>Add Email Subscription</span>
      </Button>
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Email Subscription</DialogTitle>
            <DialogDescription>
              Set up automated email updates for your dashboard metrics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subscription Name</Label>
              <Input
                id="name"
                placeholder="Weekly Sales Report"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || isAdded}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    disabled={isSubmitting || isAdded}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                      disabled={isSubmitting || isAdded}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipient}
                disabled={isSubmitting || isAdded}
                className="mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Recipient
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Email Frequency</Label>
              <RadioGroup 
                value={cadence} 
                onValueChange={(value) => setCadence(value as EmailCadence)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Daily
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Weekly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Monthly
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Dashboard Metrics to Include</Label>
              {availableQueries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No dashboard metrics available. Add queries to your dashboard first.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableQueries.map((query) => (
                    <div key={query.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={query.id} 
                        checked={selectedQueries.includes(query.id)}
                        onCheckedChange={() => handleToggleQuery(query.id)}
                      />
                      <Label htmlFor={query.id} className="text-sm">
                        {query.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting || isAdded}
            >
              Cancel
            </Button>
            
            <Button
              variant={isAdded ? "outline" : "default"}
              onClick={handleAddSubscription}
              disabled={isSubmitting || isAdded || availableQueries.length === 0}
              className={isAdded ? "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" : ""}
            >
              {isAdded ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Created!
                </>
              ) : (
                'Create Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
