'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { LayoutDashboard, Check, BarChart, LineChart, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { saveLocalDashboardQuery, VisualizationType } from '@/lib/local-storage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface AddToDashboardButtonProps {
  question: string;
  sqlQuery: string;
  result?: any; // Add result prop to analyze for chart type suggestions
}

// Helper function to guess the best visualization type based on result data
function suggestVisualizationType(result: any): VisualizationType {
  if (!result || !Array.isArray(result)) {
    return 'table';
  }
  
  // If there's only one row with one value, suggest highlight
  if (result.length === 1 && Object.keys(result[0]).length === 1) {
    return 'highlight';
  }
  
  // Check for date/time columns for time series data
  const firstRow = result[0];
  const columns = Object.keys(firstRow);
  const hasDateColumn = columns.some(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month')
  );
  
  const hasNumericColumn = columns.some(col => {
    const value = firstRow[col];
    return typeof value === 'number';
  });
  
  // If there's a date column and numeric column, suggest line chart for time series
  if (hasDateColumn && hasNumericColumn) {
    return 'line-chart';
  }
  
  // If there are categorical columns with numeric values, suggest bar chart
  if (columns.length >= 2 && hasNumericColumn) {
    return 'bar-chart';
  }
  
  // Default to table view
  return 'table';
}

export function AddToDashboardButton({ question, sqlQuery, result }: AddToDashboardButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('table');
  
  // Suggest visualization type when dialog opens or result changes
  useEffect(() => {
    if (open && result) {
      setVisualizationType(suggestVisualizationType(result));
    }
  }, [open, result]);

  const handleAddToDashboard = async () => {
    try {
      setIsSubmitting(true);
      
      // Save to localStorage with visualization type
      saveLocalDashboardQuery({
        title: title || question.substring(0, 50),
        question,
        sqlQuery,
        visualizationType,
      });
      
      setIsAdded(true);
      toast.success('Added to My Dashboard');
      
      setTimeout(() => {
        setOpen(false);
        setIsAdded(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding to dashboard:', error);
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
        onClick={() => setOpen(true)}
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
            
            <div className="space-y-3">
              <Label>Visualization Type</Label>
              <RadioGroup 
                value={visualizationType} 
                onValueChange={(value: string) => setVisualizationType(value as VisualizationType)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="highlight" id="highlight" />
                  <Label htmlFor="highlight" className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Highlight (for single values)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="line-chart" id="line-chart" />
                  <Label htmlFor="line-chart" className="flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Line Chart (for time series data)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bar-chart" id="bar-chart" />
                  <Label htmlFor="bar-chart" className="flex items-center">
                    <BarChart className="h-4 w-4 mr-2" />
                    Bar Chart (for categorical data)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="table" id="table" />
                  <Label htmlFor="table" className="flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    Table (default)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-medium mb-1">Question:</p>
              <p className="text-xs">{question}</p>
              
              <p className="text-xs font-medium mt-3 mb-1">SQL Query:</p>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {sqlQuery}
              </pre>
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
