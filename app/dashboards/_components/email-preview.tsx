'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Visualization } from './visualizations';
import { VisualizationType } from './visualization-types';
import {
  getEmailPreview,
  getEmailSubscriptions,
  getLocalDashboardQueries,
  LocalDashboardQuery
} from '@/lib/local-storage';

interface EmailPreviewProps {
  subscriptionId: string;
}

export function EmailPreview({ subscriptionId }: EmailPreviewProps) {
  const [preview, setPreview] = useState<{
    subject: string;
    body: string;
    queries: LocalDashboardQuery[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get email preview content
        const emailPreview = getEmailPreview(subscriptionId);
        if (!emailPreview) {
          throw new Error('Could not generate email preview. Subscription not found.');
        }

        setPreview(emailPreview);
        
        // For demo purposes, we'll use mock data for the results
        // In a real implementation, we would run the queries against the database
        const mockResults: Record<string, any[]> = {};
        
        emailPreview.queries.forEach(query => {
          // Generate mock data based on the query and visualization type
          switch (query.visualizationType) {
            case 'highlight':
              mockResults[query.id] = [{ value: Math.floor(Math.random() * 1000) }];
              break;
            case 'line-chart':
              // Create a line chart with time series data
              const lineData = [];
              const today = new Date();
              for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                lineData.push({
                  date: date.toLocaleDateString(),
                  value: Math.floor(Math.random() * 100),
                  growth: Math.floor(Math.random() * 50),
                });
              }
              mockResults[query.id] = lineData;
              break;
            case 'bar-chart':
              // Create a bar chart with categorical data
              mockResults[query.id] = [
                { category: 'A', value: Math.floor(Math.random() * 100) },
                { category: 'B', value: Math.floor(Math.random() * 100) },
                { category: 'C', value: Math.floor(Math.random() * 100) },
                { category: 'D', value: Math.floor(Math.random() * 100) },
              ];
              break;
            default:
              // Table data
              mockResults[query.id] = [
                { id: 1, name: 'Item 1', value: Math.floor(Math.random() * 100) },
                { id: 2, name: 'Item 2', value: Math.floor(Math.random() * 100) },
                { id: 3, name: 'Item 3', value: Math.floor(Math.random() * 100) },
              ];
          }
        });
        
        setQueryResults(mockResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate email preview');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [subscriptionId]);

  // Get subscription details for additional info
  const subscription = getEmailSubscriptions().find(sub => sub.id === subscriptionId);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex items-center justify-center p-6 text-red-500">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>{error || 'Could not generate email preview'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border">
      {/* Email Header */}
      <div className="space-y-1 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">From: Dashboard Analytics &lt;dashboards@example.com&gt;</p>
            <p className="text-sm text-muted-foreground">To: {subscription?.recipients.join(', ')}</p>
            <p className="text-sm text-muted-foreground">
              Frequency: {subscription?.cadence ? (subscription.cadence.charAt(0).toUpperCase() + subscription.cadence.slice(1)) : 'Not set'}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
        <h2 className="text-xl font-bold">{preview.subject}</h2>
      </div>

      {/* Email Body */}
      <div className="space-y-2">
        <p>{preview.body}</p>
        
        <p className="text-sm text-muted-foreground italic mt-4">
          Note: This is a preview. No emails will be sent until the subscription is activated.
        </p>
      </div>

      {/* Query Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {preview.queries.map(query => (
          <Card key={query.id} className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2">{query.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{query.question}</p>
              
              {queryResults[query.id] ? (
                <div className="h-64">
                  <Visualization 
                    data={queryResults[query.id]} 
                    type={(query.visualizationType || 'table') as VisualizationType}
                    title={query.title}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
