'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationProvider, useNotificationContext } from '../../../_context/notification-context';

// Wrapper component with NotificationProvider
export default function AnomaliesPageWrapper() {
  return (
    <NotificationProvider>
      <AnomaliesPage />
    </NotificationProvider>
  );
}

// Main component that uses the NotificationContext
function AnomaliesPage() {
  const router = useRouter();
  const { notification, updateNotificationField, isLoading, error } = useNotificationContext();
  
  // Handle form submission
  const handleSubmit = async () => {
    // Update notification content (simplified for now)
    updateNotificationField('content', {
      ...notification.content,
      anomalies: {
        enabled: true,
        threshold: 'medium',
      }
    });
    
    // Go to the next step (recipients)
    router.push('/notifications/create/recipients');
  };
  
  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <div className="flex items-center text-muted-foreground mb-2">
          <Link href="/notifications/create" className="hover:text-foreground flex items-center">
            <span>Notification Details</span>
          </Link>
          <span className="mx-2">→</span>
          <span className="font-medium text-foreground">Configure Anomaly Detection</span>
          <span className="mx-2">→</span>
          <span>Recipients</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Configure Anomaly Detection</h1>
        <p className="text-muted-foreground">
          Set up automated anomaly detection for your key metrics.
        </p>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 mr-2 text-primary" />
            Anomaly Detection Settings
          </CardTitle>
          <CardDescription>
            Configure how sensitive your anomaly detection should be
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This is a placeholder for anomaly detection configuration.</p>
          <p className="text-muted-foreground">
            In a real implementation, you would configure sensitivity levels, metrics to monitor, and notification thresholds.
          </p>
        </CardContent>
      </Card>
      
      {/* Navigation Footer */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/notifications/create">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
        >
          Continue
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
