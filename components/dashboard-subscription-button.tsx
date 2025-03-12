'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { EmailSubscriptionForm } from '@/app/dashboards/_components/email-subscription-form';
import { DashboardEmailSubscription } from '@/lib/local-storage';

interface DashboardSubscriptionButtonProps {
  initialSubscriptionName?: string;
}

export function DashboardSubscriptionButton({ initialSubscriptionName }: DashboardSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSave = (subscription: DashboardEmailSubscription) => {
    // Subscription is saved in the EmailSubscriptionForm component
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Create a partial subscription object with the initial name
  const initialSubscription = initialSubscriptionName 
    ? { 
        name: initialSubscriptionName,
        recipients: [],
        dashboardQueryIds: [],
        cadence: 'weekly' as const,
        active: true,
        id: '',
        createdAt: '',
        updatedAt: ''
      } 
    : undefined;

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="h-8 gap-1"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4 mr-1" />
        <span>Add Email Subscription</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Email Subscription</DialogTitle>
            <DialogDescription>
              Create an automated email for your dashboard metrics
            </DialogDescription>
          </DialogHeader>
          
          <EmailSubscriptionForm 
            subscription={initialSubscription}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
