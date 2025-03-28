'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, PresentationIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { NotificationProvider, useNotificationContext } from '../../_context/notification-context';

// Define the form validation schema
const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

// Wrapper component that provides the NotificationContext
export default function NotificationCreatePage() {
  return (
    <NotificationProvider>
      <DashboardReportForm />
    </NotificationProvider>
  );
}

// Form component that uses the NotificationContext
function DashboardReportForm() {
  const router = useRouter();
  const { toast } = useToast(); 
  const { notification, updateNotificationField } = useNotificationContext();
  
  // Form definition
  const form = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: notification.title || '',
      description: notification.description || '',
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof notificationFormSchema>) => {
    // Update notification context with form values
    updateNotificationField('title', values.title ?? '');
    updateNotificationField('description', values.description ?? '');
    updateNotificationField('type', 'dashboard_update');
    
    // Navigate to the metrics selection page
    router.push('/notifications/create/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create Dashboard Report</h1>
        <p className="text-muted-foreground">
          Set up a recurring report to keep your team updated on dashboard metrics
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Details</CardTitle>
              <CardDescription>
                Give your report a clear title and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Dashboard Summary" {...field} />
                    </FormControl>
                    <FormDescription>
                      A concise title for your report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A summary of key metrics from our dashboard" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide more context about this report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Fixed navigation footer */}
          <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-background border-t flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/notifications')}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button type="submit">
              Next: Select Metrics
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {/* Spacer to prevent content from being hidden behind the footer */}
          <div className="h-20"></div>
        </form>
      </Form>
    </div>
  );
}
