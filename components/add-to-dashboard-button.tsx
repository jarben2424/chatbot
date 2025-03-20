'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { LayoutDashboard, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { UIVisualizationType } from '@/lib/client-visualization-types';
import { createClient } from '@/utils/supabase/client';

interface AddToDashboardButtonProps {
  question: string;
  sqlQuery: string;
  result?: any; // Add result prop to analyze for chart type suggestions
  initialVisualizationType?: string;
}

// Helper function to guess the best visualization type based on result data
function suggestVisualizationType(result: any): UIVisualizationType {
  if (!result) {
    return 'table';
  }
  
  // Check if the result is already in the transformed format
  if (result.data && result.xKey && result.yKeys) {
    // Already transformed data 
    if (result.xKey.toLowerCase().includes('date') || 
        result.xKey.toLowerCase().includes('time') ||
        result.xKey.toLowerCase().includes('year') ||
        result.xKey.toLowerCase().includes('month')) {
      return 'line-chart';
    }
    return 'bar-chart';
  }

  // For highlight format
  if (result.value !== undefined && result.label) {
    return 'highlight';
  }
  
  // For raw array data
  const dataArray = Array.isArray(result) ? result : 
                   (result.data && Array.isArray(result.data)) ? result.data : null;
  
  if (!dataArray || dataArray.length === 0) {
    return 'table';
  }
  
  // If there's only one row with one value, suggest highlight
  if (dataArray.length === 1 && Object.keys(dataArray[0]).length === 1) {
    return 'highlight';
  }
  
  // Check for date/time columns for time series data
  const firstRow = dataArray[0];
  const columns = Object.keys(firstRow);
  
  const timeColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('day') ||
    col.toLowerCase().includes('week')
  );
  
  const numericColumns = columns.filter(col => {
    const value = firstRow[col];
    return typeof value === 'number';
  });
  
  // If there's a date column and numeric column, suggest line chart for time series
  if (timeColumns.length > 0 && numericColumns.length > 0) {
    return 'line-chart';
  }
  
  // If there are categorical columns with numeric values, suggest bar chart
  if (columns.length >= 2 && numericColumns.length > 0) {
    return 'bar-chart';
  }
  
  // Default to table
  return 'table';
}

export function AddToDashboardButton({ question, sqlQuery, result, initialVisualizationType }: AddToDashboardButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  // Set default visualization type based on the initialVisualizationType or suggest one
  const [visualizationType, setVisualizationType] = useState<UIVisualizationType>('table');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
  }, []);
  
  // Set visualization type when dialog opens
  useEffect(() => {
    if (open) {
      // Prefer initialVisualizationType if provided (from current UI selection)
      if (initialVisualizationType && ['table', 'line-chart', 'bar-chart', 'highlight'].includes(initialVisualizationType)) {
        setVisualizationType(initialVisualizationType as UIVisualizationType);
      } else if (result) {
        // Otherwise, suggest based on data
        setVisualizationType(suggestVisualizationType(result));
      }
    }
  }, [open, result, initialVisualizationType]);
  
  // Get the base URL for API calls
  const getBaseUrl = () => {
    return typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || '';
  };

  const handleButtonClick = async () => {
    try {
      setApiError(null);
      
      // Check authentication through the server-side API
      const authResponse = await fetch(`${getBaseUrl()}/api/auth/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!authResponse.ok) {
        console.error('Authentication check failed:', authResponse.status);
        toast.error('You must be logged in to add metrics to your dashboard');
        return;
      }
      
      const authData = await authResponse.json();
      console.log('Authentication successful: User ID =', authData.userId);
      
      // User is authenticated, open the dialog
      setOpen(true);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setApiError(`Authentication check failed: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('You must be logged in to add metrics to your dashboard');
    }
  };

  const handleAddToDashboard = async () => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      
      // First, check if the user is authenticated using our server API
      const authResponse = await fetch(`${getBaseUrl()}/api/auth/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!authResponse.ok) {
        console.error('Authentication check failed:', authResponse.status);
        toast.error('You must be logged in to add metrics to your dashboard');
        setIsSubmitting(false);
        return;
      }
      
      const authData = await authResponse.json();
      console.log('Authentication successful: User ID =', authData.userId);
      
      // First check if there's an existing metric with this SQL query
      const searchResponse = await fetch(`${getBaseUrl()}/api/chat-generated-metrics/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sqlQuery,
        }),
        credentials: 'include',
      });
      
      if (!searchResponse.ok) {
        console.error('Error searching for metrics:', searchResponse.status);
        toast.error('Failed to add to dashboard');
        setIsSubmitting(false);
        return;
      }
      
      const searchResult = await searchResponse.json();
      let chatMetricId: string;
      
      if (searchResult.existingMetric) {
        // Use the existing metric
        chatMetricId = searchResult.existingMetric.id;
        console.log('Using existing metric:', chatMetricId);
      } else {
        // Create a new metric
        const createResponse = await fetch(`${getBaseUrl()}/api/chat-generated-metrics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title || undefined,
            question,
            sqlQuery,
            visualizationType: initialVisualizationType || visualizationType,
            category: 'general',
          }),
          credentials: 'include',
        });
        
        if (!createResponse.ok) {
          console.error('Error creating metric:', createResponse.status);
          toast.error('Failed to add to dashboard');
          setIsSubmitting(false);
          return;
        }
        
        const newMetric = await createResponse.json();
        chatMetricId = newMetric.id;
        console.log('Created new metric:', chatMetricId);
      }
      
      // Add the metric to the user's dashboard
      const addResponse = await fetch(`${getBaseUrl()}/api/user-dashboard-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: 'chat_generated_metric',
          sourceId: chatMetricId,
          customTitle: title || null,
          customVisualizationType: (initialVisualizationType || visualizationType) !== 'table' ? (initialVisualizationType || visualizationType) : null,
          category: 'general',
        }),
        credentials: 'include',
      });
      
      if (!addResponse.ok) {
        console.error('Error adding to dashboard:', addResponse.status);
        toast.error('Failed to add to dashboard');
        setIsSubmitting(false);
        return;
      }
      
      const dashboardData = await addResponse.json();
      console.log('Added to dashboard successfully:', dashboardData.id);
      
      setIsAdded(true);
      toast.success('Added to My Dashboard');
      
      setTimeout(() => {
        setOpen(false);
        setIsAdded(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding to dashboard:', error);
      setApiError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to add to dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1"
        onClick={handleButtonClick}
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span className="text-xs">Add to Dashboard</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to dashboard</DialogTitle>
            <DialogDescription>
              Save this query to your personal dashboard for easy access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting || isAdded}
              />
              <p className="text-xs text-muted-foreground">
                If no title is provided, the question will be used.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-medium mb-1">Question:</p>
              <p className="text-xs">{question}</p>
            </div>
            
            {/* Display API errors if any */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Error occurred:</p>
                <p>{apiError}</p>
              </div>
            )}
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
              onClick={handleAddToDashboard}
              disabled={isSubmitting || isAdded}
              className={isAdded ? "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" : ""}
            >
              {isAdded ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Added!
                </>
              ) : (
                'Add to dashboard'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
