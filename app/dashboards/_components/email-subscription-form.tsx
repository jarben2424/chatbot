'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  saveEmailSubscription, 
  updateEmailSubscription, 
  DashboardEmailSubscription, 
  EmailCadence,
  getLocalDashboardQueries
} from '@/lib/local-storage';

interface EmailSubscriptionFormProps {
  subscription?: DashboardEmailSubscription;
  onSave: (subscription: DashboardEmailSubscription) => void;
  onCancel: () => void;
}

export function EmailSubscriptionForm({ subscription, onSave, onCancel }: EmailSubscriptionFormProps) {
  const [name, setName] = useState(subscription?.name || '');
  const [recipients, setRecipients] = useState(subscription?.recipients.join(', ') || '');
  const [cadence, setCadence] = useState<EmailCadence>(subscription?.cadence || 'weekly');
  const [active, setActive] = useState(subscription?.active ?? true);
  const [dashboardQueries, setDashboardQueries] = useState(getLocalDashboardQueries());
  const [selectedQueryIds, setSelectedQueryIds] = useState<string[]>(subscription?.dashboardQueryIds || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!recipients.trim()) {
      newErrors.recipients = 'At least one recipient is required';
    } else {
      const emailList = recipients.split(',').map(email => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        newErrors.recipients = `Invalid email(s): ${invalidEmails.join(', ')}`;
      }
    }
    
    if (selectedQueryIds.length === 0) {
      newErrors.queries = 'At least one dashboard query must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const emailList = recipients.split(',').map(email => email.trim());
    
    if (subscription) {
      // Update existing subscription
      const updatedSubscription = updateEmailSubscription(subscription.id, {
        name,
        recipients: emailList,
        cadence,
        active,
        dashboardQueryIds: selectedQueryIds,
      });
      
      if (updatedSubscription) {
        onSave(updatedSubscription);
      }
    } else {
      // Create new subscription
      const newSubscription = saveEmailSubscription({
        name,
        recipients: emailList,
        cadence,
        active,
        dashboardQueryIds: selectedQueryIds,
      });
      
      onSave(newSubscription);
    }
  };

  const toggleQuerySelection = (queryId: string) => {
    setSelectedQueryIds(prevIds => {
      if (prevIds.includes(queryId)) {
        return prevIds.filter(id => id !== queryId);
      } else {
        return [...prevIds, queryId];
      }
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{subscription ? 'Edit Email Subscription' : 'New Email Subscription'}</CardTitle>
        <CardDescription>
          Create an automated email for your dashboard metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Subscription Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly Sales Report"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients (comma separated)</Label>
            <Input
              id="recipients"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="user@example.com, manager@example.com"
              className={errors.recipients ? 'border-red-500' : ''}
            />
            {errors.recipients && <p className="text-sm text-red-500">{errors.recipients}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Email Frequency</Label>
            <RadioGroup
              value={cadence}
              onValueChange={(value: string) => setCadence(value as EmailCadence)}
              className="flex flex-col space-y-2 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="cursor-pointer">Daily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">Weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={active}
                onCheckedChange={(checked) => setActive(checked as boolean)}
              />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When active, this subscription will automatically send emails at the selected frequency
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Dashboard Metrics</Label>
            {errors.queries && <p className="text-sm text-red-500">{errors.queries}</p>}
            
            {dashboardQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No dashboard queries available. Add some queries to your dashboard first.
              </p>
            ) : (
              <div className="space-y-2 mt-2 border rounded-md p-3">
                {dashboardQueries.map(query => (
                  <div key={query.id} className="flex items-start space-x-2 py-2 border-b last:border-0">
                    <Checkbox
                      id={`query-${query.id}`}
                      checked={selectedQueryIds.includes(query.id)}
                      onCheckedChange={() => toggleQuerySelection(query.id)}
                    />
                    <div>
                      <Label htmlFor={`query-${query.id}`} className="cursor-pointer font-medium">
                        {query.title}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {query.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {subscription ? 'Update Subscription' : 'Create Subscription'}
        </Button>
      </CardFooter>
    </Card>
  );
}
