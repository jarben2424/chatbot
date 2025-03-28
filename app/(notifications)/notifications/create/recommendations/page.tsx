'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationProvider, useNotificationContext } from '../../../_context/notification-context';

// Wrapper component with NotificationProvider
export default function RecommendationsPageWrapper() {
  return (
    <NotificationProvider>
      <RecommendationsPage />
    </NotificationProvider>
  );
}

// Main component that uses the NotificationContext
function RecommendationsPage() {
  const router = useRouter();
  const { notification, updateNotificationField, isLoading, error } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<string>('sales');
  
  // Handle form submission
  const handleSubmit = async () => {
    // Update notification content (simplified for now)
    updateNotificationField('content', {
      ...notification.content,
      recommendations: {
        enabled: true,
        areas: ['sales', 'marketing']
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
          <span className="font-medium text-foreground">Configure Recommendations</span>
          <span className="mx-2">→</span>
          <span>Recipients</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Configure AI Recommendations</h1>
        <p className="text-muted-foreground">
          Set up AI-powered recommendations for your business.
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
            <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
            Recommendation Settings
          </CardTitle>
          <CardDescription>
            Choose which areas you want to receive AI recommendations for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="sales" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales" className="space-y-4">
              <h3 className="font-medium">Sales Recommendations</h3>
              <p>AI will analyze your sales data and provide actionable insights.</p>
              <div className="p-4 rounded-md border bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  Example: "Based on customer purchase patterns, we recommend adjusting your discount strategy for high-value products."
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="marketing" className="space-y-4">
              <h3 className="font-medium">Marketing Recommendations</h3>
              <p>AI will analyze marketing campaigns and suggest improvements.</p>
              <div className="p-4 rounded-md border bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  Example: "Your email campaigns perform 25% better on Tuesdays. Consider adjusting your sending schedule."
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <h3 className="font-medium">Product Recommendations</h3>
              <p>AI will analyze product performance and provide inventory insights.</p>
              <div className="p-4 rounded-md border bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  Example: "Product X has been consistently low in stock. Consider increasing your reorder quantity."
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
